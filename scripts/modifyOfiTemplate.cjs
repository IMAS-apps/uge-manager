/**
 * Script to modify the OFI template to use docx-templates FOR loops.
 * 
 * Usage: node scripts/modifyOfiTemplate.js
 * 
 * This script:
 * 1. Opens the original template
 * 2. Modifies the XML to replace hardcoded repetitions with FOR/END-FOR loops
 * 3. Renames variables: factures.X → factura.X, records.X → factura.record.X
 * 4. Saves the modified template (overwrites original)
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'templates', 'Memòria_justificativa_OFI.docx');
const BACKUP_PATH = path.join(__dirname, '..', 'public', 'templates', 'Memòria_justificativa_OFI_BACKUP.docx');

async function main() {
  console.log('Reading template:', TEMPLATE_PATH);
  const buf = fs.readFileSync(TEMPLATE_PATH);

  // Create backup
  fs.copyFileSync(TEMPLATE_PATH, BACKUP_PATH);
  console.log('Backup created:', BACKUP_PATH);

  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  // --- Step 1: Process body text sections ---
  // Split XML by </w:p> to work at paragraph level
  const paragraphs = xml.split('</w:p>');

  // Find paragraph indices by their text content
  function getParText(parXml) {
    return parXml.replace(/<[^>]+>/g, '').trim();
  }

  // Identify paragraph groups for Section 2 (motivacio) and Section 4 (justificacio_preu)
  // Section 2: PAR 37-42 (3 pairs of descripcio+motivacio)
  // Section 4: PAR 56-61 (3 pairs of descripcio+justificacio_preu)
  // Table: ROW 1-3 (3 data rows)

  const bodyMotivacioIndices = [];
  const bodyJustificacioIndices = [];
  let foundMotivacioSection = false;
  let foundJustificacioSection = false;

  for (let i = 0; i < paragraphs.length; i++) {
    const text = getParText(paragraphs[i]);

    // Detect section 2 block (motivacio_no_contractacio in body text, not in table)
    if (text.includes('{{factures.descripcio}}') && text.includes('{{factures.periode}}') && !foundMotivacioSection) {
      // Check if next paragraph has motivacio
      const nextText = getParText(paragraphs[i + 1] || '');
      if (nextText.includes('{{records.motivacio_no_contractacio}}')) {
        bodyMotivacioIndices.push(i, i + 1);
        foundMotivacioSection = true;
        // Find remaining 2 repetitions
        for (let j = i + 2; j < Math.min(i + 10, paragraphs.length); j++) {
          const jText = getParText(paragraphs[j]);
          if (jText.includes('{{factures.descripcio}}') || jText.includes('{{records.motivacio_no_contractacio}}')) {
            bodyMotivacioIndices.push(j);
          }
        }
        continue;
      }
    }

    // Detect section 4 block (justificacio_preu in body text)
    if (text.includes('{{factures.descripcio}}') && text.includes('{{factures.periode}}') && foundMotivacioSection && !foundJustificacioSection) {
      const nextText = getParText(paragraphs[i + 1] || '');
      if (nextText.includes('{{records.justificacio_preu}}')) {
        bodyJustificacioIndices.push(i, i + 1);
        foundJustificacioSection = true;
        for (let j = i + 2; j < Math.min(i + 10, paragraphs.length); j++) {
          const jText = getParText(paragraphs[j]);
          if (jText.includes('{{factures.descripcio}}') || jText.includes('{{records.justificacio_preu}}')) {
            bodyJustificacioIndices.push(j);
          }
        }
        continue;
      }
    }
  }

  console.log('Section 2 (motivacio) paragraph indices:', bodyMotivacioIndices);
  console.log('Section 4 (justificacio_preu) paragraph indices:', bodyJustificacioIndices);

  // Helper: create a simple paragraph with text, copying formatting from a reference paragraph
  function makeSimpleParagraph(text, refPar) {
    // Extract paragraph properties from reference
    const pPrMatch = refPar.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const rPrMatch = refPar.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
    const pPr = pPrMatch ? pPrMatch[0] : '';
    const rPr = rPrMatch ? rPrMatch[0] : '';

    return `<w:p>${pPr}<w:r>${rPr}<w:t>${text}</w:t></w:r>`;
  }

  // --- Process Section 2: Replace 3 pairs with FOR loop ---
  if (bodyMotivacioIndices.length >= 6) {
    const firstDescIdx = bodyMotivacioIndices[0]; // First descripcio paragraph
    const firstMotIdx = bodyMotivacioIndices[1];  // First motivacio paragraph
    const refPar = paragraphs[firstDescIdx];

    // Rename variables in the first pair
    paragraphs[firstDescIdx] = paragraphs[firstDescIdx]
      .replace(/factures\./g, '$factura.')
      .replace(/records\./g, '$factura.record.');
    paragraphs[firstMotIdx] = paragraphs[firstMotIdx]
      .replace(/factures\./g, '$factura.')
      .replace(/records\./g, '$factura.record.');

    // Insert FOR before first paragraph
    const forPar = makeSimpleParagraph('{{FOR factura IN factures}}', refPar);
    paragraphs[firstDescIdx] = forPar + '</w:p>' + paragraphs[firstDescIdx];

    // Insert END-FOR after first motivacio paragraph
    const endForPar = makeSimpleParagraph('{{END-FOR factura}}', refPar);
    paragraphs[firstMotIdx] = paragraphs[firstMotIdx] + '</w:p>' + endForPar;

    // Remove the remaining 4 duplicate paragraphs (indices 2-5)
    for (let k = 2; k < bodyMotivacioIndices.length; k++) {
      paragraphs[bodyMotivacioIndices[k]] = '<!-- REMOVED -->';
    }
  }

  // --- Process Section 4: Replace 3 pairs with FOR loop ---
  if (bodyJustificacioIndices.length >= 6) {
    const firstDescIdx = bodyJustificacioIndices[0];
    const firstJustIdx = bodyJustificacioIndices[1];
    const refPar = paragraphs[firstDescIdx];

    // Rename variables in the first pair
    paragraphs[firstDescIdx] = paragraphs[firstDescIdx]
      .replace(/factures\./g, '$factura.')
      .replace(/records\./g, '$factura.record.');
    paragraphs[firstJustIdx] = paragraphs[firstJustIdx]
      .replace(/factures\./g, '$factura.')
      .replace(/records\./g, '$factura.record.');

    // Insert FOR before first paragraph
    const forPar = makeSimpleParagraph('{{FOR factura IN factures}}', refPar);
    paragraphs[firstDescIdx] = forPar + '</w:p>' + paragraphs[firstDescIdx];

    // Insert END-FOR after first justificacio paragraph
    const endForPar = makeSimpleParagraph('{{END-FOR factura}}', refPar);
    paragraphs[firstJustIdx] = paragraphs[firstJustIdx] + '</w:p>' + endForPar;

    // Remove remaining duplicate paragraphs
    for (let k = 2; k < bodyJustificacioIndices.length; k++) {
      paragraphs[bodyJustificacioIndices[k]] = '<!-- REMOVED -->';
    }
  }

  // Rejoin paragraphs
  xml = paragraphs.join('</w:p>');

  // --- Step 2: Process table rows ---
  // Split by </w:tr> to work at table row level
  const rows = xml.split('</w:tr>');

  const dataRowIndices = [];
  for (let i = 0; i < rows.length; i++) {
    const text = getParText(rows[i]);
    if (text.includes('{{factures.numero_registre}}') && text.includes('{{records.adjudicatari}}')) {
      dataRowIndices.push(i);
    }
  }

  console.log('Table data row indices:', dataRowIndices);

  if (dataRowIndices.length >= 3) {
    const firstRowIdx = dataRowIndices[0];

    // Rename variables in first row
    // Handle both cases: "records." as continuous text AND "records" as standalone in <w:t> tags
    // (Word splits template tags across multiple XML runs)
    rows[firstRowIdx] = rows[firstRowIdx]
      .replace(/factures\./g, '$factura.')
      .replace(/records\./g, '$factura.record.')
      .replace(/<w:t>records<\/w:t>/g, '<w:t>$factura.record</w:t>')
      .replace(/<w:t xml:space="preserve">records<\/w:t>/g, '<w:t xml:space="preserve">$factura.record</w:t>')
      .replace(/justificacio_preu/g, 'justificacio_preu_short')
      .replace(/motivacio_no_contractacio/g, 'motivacio_no_contractacio_short');

    // Replace the hardcoded row number "1" with {{$idx + 1}}
    // Find the first <w:t> that contains just "1" in the first cell
    rows[firstRowIdx] = rows[firstRowIdx].replace(
      /(<w:tc>[\s\S]*?<w:t[^>]*>)1(<\/w:t>)/,
      '$1{{$idx + 1}}$2'
    );

    let forRow = rows[firstRowIdx].replace(/(<w:t>|<w:t [^>]*>)[\s\S]*?<\/w:t>/g, '<w:t></w:t>');
    forRow = forRow.replace('<w:t></w:t>', '<w:t>{{FOR factura IN factures}}</w:t>');

    let endForRow = rows[firstRowIdx].replace(/(<w:t>|<w:t [^>]*>)[\s\S]*?<\/w:t>/g, '<w:t></w:t>');
    endForRow = endForRow.replace('<w:t></w:t>', '<w:t>{{END-FOR factura}}</w:t>');

    // Wrap the data row with the loop rows
    rows[firstRowIdx] = forRow + '</w:tr>' + rows[firstRowIdx] + '</w:tr>' + endForRow;

    // Remove duplicate rows (row 2 and 3)
    for (let k = 1; k < dataRowIndices.length; k++) {
      rows[dataRowIndices[k]] = '<!-- REMOVED ROW -->';
    }
  }

  // Rejoin rows
  xml = rows.join('</w:tr>');

  // --- Step 3: Fix the accent typo in justificació_general ---
  // The template has "justificació_general" but the DB field is "justificacio_general"
  xml = xml.replace(/justificació_general/g, 'justificacio_general');

  // --- Step 4: Clean up removed markers ---
  xml = xml.replace(/<!-- REMOVED --><\/w:p>/g, '');
  xml = xml.replace(/<!-- REMOVED ROW --><\/w:tr>/g, '');

  // Save modified template
  zip.file('word/document.xml', xml);
  const output = await zip.generateAsync({ type: 'nodebuffer' });
  const outputPath = TEMPLATE_PATH.replace('.docx', '_modified.docx');
  fs.writeFileSync(outputPath, output);
  console.log('Modified template saved to:', outputPath);
  console.log('NOTE: Rename this file to Memòria_justificativa_OFI.docx after closing Word.');
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
