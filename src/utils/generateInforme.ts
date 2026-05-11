/**
 * REPLACEMENTS REQUIRED IN THE TEMPLATE FILE:
 * Path: public/templates/Informe_de_necessitats_AD.docx
 * 
 * The template uses standard {{double_braces}} as delimiters. 
 * Use the EXACT names below (case sensitive, no spaces or parentheses):
 * 
 * - {{record.organ_contractacio}}
 * - {{record.responsable_contracte}}
 * - {{record.nom}}
 * - {{record.email}}
 * - {{record.objecte_contracte}}
 * - {{record.justificacio}}
 * - {{record.caracteristiques_tecniques}}
 * - {{record.tipus_contracte}}
 * - {{record.codi_cpv}}
 * - {{record.base_imposable}}
 * - {{record.quota_iva}}
 * - {{record.partida_organica}}
 * - {{record.partida_programa}}
 * - {{record.partida_economica}}
 * 
 * Custom formatted fields:
 * - {{Import_total_}} (Example: 121.00 €)
 */

import { createReport } from 'docx-templates';
import { Record, OFI } from '../types';
import { supabase } from '../lib/supabase';

export async function generateInforme(record: Record): Promise<void> {
    try {
        // 1. Determine template path based on sistema_tramitacio
        let templatePath = '';
        const sistema = record.sistema_tramitacio;

        if (sistema === 'AD') {
            templatePath = '/templates/Informe_de_necessitats_AD.docx';
        } else if (sistema === 'ADO') {
            templatePath = '/templates/Informe_de_necessitats_ADO.docx';
        } else if (sistema === 'OFI') {
            templatePath = '/templates/Informe_de_necessitats_OFI.docx';
        } else if (sistema === 'REC') {
            templatePath = '/templates/Informe_de_necessitats_REC.docx';
        } else {
            throw new Error(`Sistema no suportat per a informes: ${sistema}`);
        }

        // 2. Fetch the template from the calculated path as an ArrayBuffer
        const response = await fetch(templatePath);
        if (!response.ok) {
            throw new Error(`No s'ha pogut carregar la plantilla (${templatePath}): ${response.statusText}`);
        }
        const template = await response.arrayBuffer();

        // Format date helper
        const fmtDate = (dateStr: string | null | undefined): string => {
            if (!dateStr) return '';
            try {
                return new Date(dateStr).toLocaleDateString('ca-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                });
            } catch {
                return dateStr;
            }
        };

        // 2. Map record fields to template variables (both flat and nested for flexibility)
        const data = {
            record: {
                ...record,
                data_ofi_inicial: fmtDate(record.data_ofi_inicial)
            },

            // Clean aliases (no spaces or parentheses allowed in template tags)
            total: `${(record.base_imposable + record.quota_iva).toFixed(2)} €`,

            // Flat aliases for simpler tags
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

/**
 * Generates the "Comunicació OFI proveïdors" document.
 * Template: public/templates/Comunicacio_OFI_proveidors.docx
 * Fields: {{record.campo}}
 */
export async function generateComunicacioOFI(record: Record): Promise<void> {
    try {
        const templatePath = '/templates/Comunicacio_OFI_proveidors.docx';

        const response = await fetch(templatePath);
        if (!response.ok) {
            throw new Error(`No s'ha pogut carregar la plantilla (${templatePath}): ${response.statusText}`);
        }
        const template = await response.arrayBuffer();

        const data = {
            record: record,
            total: `${((record.base_imposable || 0) + (record.quota_iva || 0)).toFixed(2)} €`,
        };

        const report = await createReport({
            template: new Uint8Array(template),
            data: data,
            cmdDelimiter: ['{{', '}}'],
        });

        const blob = new Blob([report as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `Comunicacio_OFI_${record.id}.docx`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (err: any) {
        throw new Error("Error en generar la comunicació OFI: " + err.message);
    }
}

/**
 * Generates the "Memòria justificativa OFI" document.
 * Template: public/templates/Memòria_justificativa_OFI.docx (modified with FOR loops)
 *
 * Data sources:
 * - ofi / ofi_with_aggregates: OFI header data (codi_ofi, centre_servei, total_import, etc.)
 * - factures: invoices linked via factures.expedient = ofi.expedient_ofi
 * - records: solicitud records linked via factures.record_id = records.id
 *
 * Template uses FOR loops:
 * - {{FOR factura OF factures}} ... {{END-FOR factura}} for body text and table rows
 * - {{factura.xxx}} for invoice fields
 * - {{factura.record.xxx}} for linked record fields
 *
 * User requirement: In the table, justificacio_preu and motivacio_no_contractacio
 * show only the first 2 characters (e.g. "a)")
 */
export async function generateMemoriaOFI(ofi: OFI): Promise<void> {
    try {
        // 1. Fetch template
        const templatePath = '/templates/Memòria_justificativa_OFI.docx';
        const response = await fetch(templatePath);
        if (!response.ok) {
            throw new Error(`No s'ha pogut carregar la plantilla (${templatePath}): ${response.statusText}`);
        }
        const template = await response.arrayBuffer();

        // 2. Fetch factures linked to this OFI, with their parent record data
        const { data: facturesData, error: facturesError } = await (supabase as any)
            .from('factures')
            .select('*, records(nom, objecte_contracte, adjudicatari, nif, motivacio_no_contractacio, justificacio_preu, partida_organica, partida_programa, partida_economica, tipus_contracte, data_ofi_inicial, explicacio_no_contractacio, explicacio_preu, segex)')
            .eq('expedient', ofi.expedient_ofi)
            .order('data', { ascending: true });

        if (facturesError) throw facturesError;

        // 3. Format currency helper
        const fmtCurrency = (amount: number | null | undefined): string => {
            if (amount === null || amount === undefined) return '0,00';
            return new Intl.NumberFormat('ca-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        };

        // 4. Format date helper
        const fmtDate = (dateStr: string | null | undefined): string => {
            if (!dateStr) return '';
            try {
                return new Date(dateStr).toLocaleDateString('ca-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                });
            } catch {
                return dateStr;
            }
        };

        // 5. Build factures array for template
        const factures = (facturesData || []).map((f: any) => ({
            descripcio: f.descripcio || '',
            periode: f.periode || '',
            numero_registre: f.numero_registre || '',
            numero_factura: f.numero_factura || '',
            data: fmtDate(f.data),
            import_total: fmtCurrency(f.import_total),
            record: {
                adjudicatari: f.records?.adjudicatari || '',
                nif: f.records?.nif || '',
                motivacio_no_contractacio: f.records?.motivacio_no_contractacio || '',
                justificacio_preu: f.records?.justificacio_preu || '',
                // Table-only fields: truncated to first 2 chars (e.g. "a)")
                motivacio_no_contractacio_short: (f.records?.motivacio_no_contractacio || '').substring(0, 2),
                justificacio_preu_short: (f.records?.justificacio_preu || '').substring(0, 2),
                partida_organica: f.records?.partida_organica || '',
                partida_programa: f.records?.partida_programa || '',
                partida_economica: f.records?.partida_economica || '',
                tipus_contracte: f.records?.tipus_contracte || '',
                data_ofi_inicial: fmtDate(f.records?.data_ofi_inicial),
                explicacio_no_contractacio: f.records?.explicacio_no_contractacio || '',
                explicacio_preu: f.records?.explicacio_preu || '',
                segex: f.records?.segex || '',
            },
        }));

        // 6. Build data object
        const data = {
            ofi: {
                codi_ofi: ofi.codi_ofi || '',
                centre_servei: ofi.centre_servei || '',
                justificacio_general: ofi.justificacio_general || '',
            },
            ofi_with_aggregates: {
                total_import: fmtCurrency(ofi.total_import),
            },
            factures,
        };

        // 7. Generate document
        const report = await createReport({
            template: new Uint8Array(template),
            data: data,
            cmdDelimiter: ['{{', '}}'],
        });

        // 8. Download
        const blob = new Blob([report as any], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        const safeCodi = ofi.codi_ofi.replace(/[\s/\\]+/g, '_');
        link.href = url;
        link.download = `Memoria_justificativa_OFI_${safeCodi}.docx`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (err: any) {
        throw new Error("Error en generar la memòria justificativa OFI: " + err.message);
    }
}
