import 'dotenv/config';
import { supabase } from '../db/supabase';
import { embedBatch } from '../services/embedder';
import { chunkText } from '../services/chunker';
import { SYNTHETIC_PATIENTS } from './syntheticData';

const EMBED_BATCH_SIZE = 20;

async function main() {
  console.log('=== Loading Synthetic Patient Data ===\n');
  console.log(`Total patients to load: ${SYNTHETIC_PATIENTS.length}\n`);

  let loaded = 0;
  let skipped = 0;
  let totalChunks = 0;

  for (const sp of SYNTHETIC_PATIENTS) {
    // Idempotency check — skip if MRN already exists
    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .eq('mrn', sp.mrn)
      .maybeSingle();

    if (existing) {
      // Check if patient has chunks — if not, delete and retry
      const { count } = await supabase
        .from('document_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('metadata->>patient_id', existing.id);

      if (count && count > 0) {
        console.log(`⏭ Skipping ${sp.first_name} ${sp.last_name} (${sp.mrn}) — already loaded with ${count} chunks`);
        skipped++;
        continue;
      }

      // Patient exists but has no chunks — delete and re-insert
      console.log(`🔄 ${sp.first_name} ${sp.last_name} (${sp.mrn}) exists with 0 chunks — re-loading...`);
      await supabase.from('coverage').delete().eq('patient_id', existing.id);
      await supabase.from('patients').delete().eq('id', existing.id);
    }

    // 1. Insert patient
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .insert({
        first_name: sp.first_name,
        last_name: sp.last_name,
        dob: sp.dob,
        mrn: sp.mrn,
      })
      .select()
      .single();

    if (patientErr) {
      console.error(`❌ Failed to insert patient ${sp.mrn}:`, patientErr.message);
      continue;
    }

    // 2. Insert coverage
    const { error: covErr } = await supabase.from('coverage').insert({
      patient_id: patient.id,
      payer: sp.payer,
      member_id: sp.member_id,
      plan_name: sp.plan_name,
      is_active: true,
    });

    if (covErr) {
      console.error(`❌ Failed to insert coverage for ${sp.mrn}:`, covErr.message);
      continue;
    }

    // 3. Chunk all documents
    const allChunks: Array<{
      content: string;
      record_type: string;
      date: string;
      source_filename: string;
      chunk_index: number;
    }> = [];

    for (const doc of sp.documents) {
      const chunks = chunkText(doc.content, 256, 32);
      chunks.forEach((content, i) => {
        allChunks.push({
          content,
          record_type: doc.record_type,
          date: doc.date,
          source_filename: doc.source_filename,
          chunk_index: i,
        });
      });
    }

    // 4. Embed in batches of EMBED_BATCH_SIZE
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
      const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE);
      const embeddings = await embedBatch(batch.map((c) => c.content));
      allEmbeddings.push(...embeddings);
    }

    // 5. Insert document_chunks
    const rows = allChunks.map((chunk, i) => ({
      content: chunk.content,
      embedding: allEmbeddings[i],
      metadata: {
        type: 'clinical',
        patient_id: patient.id,
        record_type: chunk.record_type,
        date: chunk.date,
        source_filename: chunk.source_filename,
      },
      source_filename: chunk.source_filename,
      chunk_index: chunk.chunk_index,
    }));

    const { error: chunkErr } = await supabase.from('document_chunks').insert(rows);
    if (chunkErr) {
      console.error(`❌ Failed to insert chunks for ${sp.mrn}:`, chunkErr.message);
      continue;
    }

    totalChunks += rows.length;
    loaded++;
    console.log(
      `✅ [${loaded + skipped}/${SYNTHETIC_PATIENTS.length}] ${sp.first_name} ${sp.last_name} (${sp.mrn}) — ${sp.primary_cpt} — ${rows.length} chunks`
    );
  }

  console.log('\n=== Load Complete ===');
  console.log(`Loaded: ${loaded} patients`);
  console.log(`Skipped: ${skipped} patients (already existed)`);
  console.log(`Total chunks inserted: ${totalChunks}`);
}

main().catch((err) => {
  console.error('Load failed:', err);
  process.exit(1);
});
