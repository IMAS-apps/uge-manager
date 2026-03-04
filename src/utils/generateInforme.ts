/**
 * REPLACEMENTS REQUIRED IN THE TEMPLATE FILE:
 * Path: public/templates/Informe_de_necessitats_AD.docx
 * 
 * Please manually open the .docx file and replace each «placeholder» with {{placeholder}}
 * using the exact variable names below:
 * 
 * - «Òrgan_de_contractació»           ->  {{Organ_de_contractacio}}
 * - «Responsable_del_contracte»        ->  {{Responsable_del_contracte}}
 * - «Nombre»                           ->  {{Nombre}}
 * - «Correo_electrónico»               ->  {{Correo_electronico}}
 * - «Objecte_del_contrate_descripció_del_que» -> {{Objecte_del_contrate_descripcio_del_que}}
 * - «Descripció_de_la_necessitat_a_satisfer_» -> {{Descripcio_de_la_necessitat_a_satisfer_}}
 * - «Característiques_tècniques_especificaci» -> {{Caracteristiques_tecniques_especificaci}}
 * - «Tipus_de_contracte»               ->  {{Tipus_de_contracte}}
 * - «Códi_dobjecte_contractual_CPV»    ->  {{Codi_dobjecte_contractual_CPV}}
 * - «Base_imposable_»                  ->  {{Base_imposable_}}
 * - «Quota_dIVA_»                      ->  {{Quota_dIVA_}}
 * - «Import_total_»                    ->  {{Import_total_}}
 * - «Termini_dexecució_o_durada_previstaen» -> {{Termini_dexecucio_o_durada_previstaen}}
 * - «Partida orgànica»                 ->  {{Partida_organica}}
 * - «Partida programa»                 ->  {{Partida_programa}}
 * - «Partida econòmica»                ->  {{Partida_economica}}
 */

import { createReport } from 'docx-templates';

export async function generateInforme(record: any): Promise<void> {
    try {
        // 1. Fetch the template from /templates/Informe_de_necessitats_AD.docx as an ArrayBuffer
        const response = await fetch('/templates/Informe_de_necessitats_AD.docx');
        if (!response.ok) {
            throw new Error(`No s'ha pogut carregar la plantilla: ${response.statusText}`);
        }
        const template = await response.arrayBuffer();

        // 2. Map record fields to template variables
        const data = {
            Organ_de_contractacio: record.organ_contractacio,
            Responsable_del_contracte: record.responsable_contracte,
            Nombre: record.nom,
            Correo_electronico: record.email,
            Objecte_del_contrate_descripcio_del_que: record.objecte_contracte,
            Descripcio_de_la_necessitat_a_satisfer_: record.justificacio,
            Caracteristiques_tecniques_especificaci: record.caracteristiques_tecniques,
            Tipus_de_contracte: record.tipus_contracte,
            Codi_dobjecte_contractual_CPV: record.codi_cpv,
            Base_imposable_: `${record.base_imposable} €`,
            Quota_dIVA_: `${record.quota_iva} €`,
            Import_total_: `${(record.base_imposable + record.quota_iva).toFixed(2)} €`,
            Termini_dexecucio_o_durada_previstaen: `${record.termini_execucio} dies`,
            Partida_organica: record.partida_organica,
            Partida_programa: record.partida_programa,
            Partida_economica: record.partida_economica,
        };

        // 3. Use docx-templates to substitute variables
        const report = await createReport({
            template: new Uint8Array(template),
            data: data,
            cmdDelimiter: ['{{', '}}'],
        });

        // 4. Trigger browser file download
        const blob = new Blob([report as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Replace spaces with underscores in filename
        const safeOrgan = record.organ_contractacio.replace(/\s+/g, '_');
        link.href = url;
        link.download = `Informe_${safeOrgan}_${record.id}.docx`;

        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (err: any) {
        throw new Error("Error en generar l'informe: " + err.message);
    }
}
