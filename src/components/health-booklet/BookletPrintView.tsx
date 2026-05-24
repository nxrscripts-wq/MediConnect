import React from 'react'
import { HealthBooklet } from '@/types/healthBooklet'
import { formatDate } from '@/lib/exportUtils'

interface BookletPrintViewProps {
  booklet: HealthBooklet
}

export const BookletPrintView: React.FC<BookletPrintViewProps> = ({ booklet }) => {
  // Sort vaccines to easily map tetanus doses
  const getVaccineDose = (code: string) => {
    return booklet.vaccines?.find(v => v.vaccine_code === code)
  }

  const ttDoses = [
    { code: 'tt_1', label: 'T.T. 1ª Dose' },
    { code: 'tt_2', label: 'T.T. 2ª Dose' },
    { code: 'tt_3', label: 'T.T. 3ª Dose' },
    { code: 'tt_4', label: 'T.T. 4ª Dose' },
    { code: 'tt_5', label: 'T.T. 5ª Dose' },
  ]

  const otherVaccines = booklet.vaccines?.filter(v => !v.vaccine_code.startsWith('tt_')) || []
  const activeInspections = booklet.inspections?.slice(0, 5) || []

  return (
    <div className="hidden print:block w-full text-neutral-900 bg-white" style={{ fontFamily: 'sans-serif' }}>
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page {
            page-break-after: always;
            box-sizing: border-box;
            width: 210mm; /* A4 width */
            height: 148mm; /* A5 height (Landscape) */
            padding: 10mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15mm;
            border: none;
          }
          .booklet-border {
            border: 2px solid #0A5C75;
            padding: 6mm;
            border-radius: 4px;
            height: 100%;
            display: flex;
            flex-col: column;
            justify-content: space-between;
            position: relative;
          }
          .stamp-box {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            opacity: 0.85;
          }
        }
      `}</style>

      {/* PAGE 1: CAPA (DIREITA) & DADOS DE IDENTIFICAÇÃO (ESQUERDA) */}
      <div className="print-page">
        {/* LADO ESQUERDO: IDENTIFICAÇÃO DO TITULAR */}
        <div className="booklet-border flex flex-col justify-between h-full">
          <div>
            <div className="text-center mb-4">
              <span className="text-[10px] font-bold text-[#0A5C75] tracking-widest uppercase">
                IDENTIFICAÇÃO DO TITULAR
              </span>
              <div className="h-[1px] bg-[#0A5C75]/30 mt-1 w-full" />
            </div>

            <div className="grid grid-cols-3 gap-3 items-start">
              {/* Photo Box */}
              <div className="col-span-1 border border-neutral-300 rounded p-1 bg-neutral-50 flex items-center justify-center aspect-[3/4]">
                {booklet.photo_url ? (
                  <img
                    src={booklet.photo_url}
                    alt="Foto Titular"
                    className="w-full h-full object-cover rounded-sm"
                  />
                ) : (
                  <div className="text-[8px] text-neutral-400 text-center font-mono py-6">
                    FOTO 3x4
                  </div>
                )}
              </div>

              {/* Demographics */}
              <div className="col-span-2 space-y-1.5 text-[9px]">
                <div>
                  <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Nome Completo</span>
                  <span className="font-bold text-[11px] text-neutral-900 leading-tight">
                    {booklet.patient?.full_name}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Número do BI</span>
                  <span className="font-mono font-bold text-neutral-800">
                    {booklet.bi_number || booklet.patient?.national_id || '—'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Data Nasc.</span>
                    <span className="font-mono">
                      {booklet.patient?.date_of_birth ? formatDate(booklet.patient.date_of_birth) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Naturalidade</span>
                    <span>{booklet.birth_place || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[9px]">
              <div>
                <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Estado Civil</span>
                <span>{booklet.civil_status || '—'}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Profissão</span>
                <span>{booklet.profession || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Local de Trabalho</span>
                <span>{booklet.workplace || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-neutral-500 uppercase block text-[7px]">Observações de Saúde</span>
                <p className="italic text-neutral-600 leading-tight text-[8px]">
                  {booklet.observations || 'Nenhuma contra-indicação ou alergia digna de registo clínico.'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-2 flex justify-between items-end text-[7px] text-neutral-400">
            <span>MEDICONNECT SYSTEM</span>
            <span className="font-mono font-bold text-[#0A5C75] text-[9px]">
              {booklet.booklet_number}
            </span>
          </div>
        </div>

        {/* LADO DIREITO: CAPA OFICIAL DO BOLETIM */}
        <div className="booklet-border flex flex-col justify-between items-center text-center h-full bg-neutral-50/20">
          <div className="flex flex-col items-center">
            {/* Angola Coat of Arms Simulation */}
            <div className="w-12 h-12 border-2 border-[#0A5C75] rounded-full flex items-center justify-center bg-amber-50 mb-3">
              <span className="text-amber-600 font-bold text-[9px]">MINSA</span>
            </div>
            <h1 className="text-[12px] font-bold text-neutral-900 tracking-wider">
              REPÚBLICA DE ANGOLA
            </h1>
            <h2 className="text-[10px] font-semibold text-neutral-600 tracking-wide mt-0.5">
              MINISTÉRIO DA SAÚDE
            </h2>
            <div className="w-8 h-[2px] bg-[#0A5C75] my-4" />
          </div>

          <div className="my-auto">
            <h3 className="text-[15px] font-extrabold text-[#0A5C75] tracking-widest leading-none">
              BOLETIM DE SANIDADE
            </h3>
            <span className="text-[7px] text-neutral-400 tracking-[0.3em] uppercase block mt-2">
              DOCUMENTO SANITÁRIO OFICIAL
            </span>
          </div>

          <div className="w-full text-center space-y-1">
            <div className="font-mono font-bold text-neutral-800 text-[11px] bg-[#0A5C75]/5 py-1 px-3 rounded inline-block">
              {booklet.booklet_number}
            </div>
            <p className="text-[8px] text-neutral-500 font-mono">
              Emissão: {formatDate(booklet.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* PAGE 2: CONTROLE DE VACINAS (ESQUERDA) & INSPEÇÃO SANITÁRIA (DIREITA) */}
      <div className="print-page">
        {/* LADO ESQUERDO: CONTROLE DE VACINAÇÃO VAT (T.T.) */}
        <div className="booklet-border flex flex-col justify-between h-full">
          <div>
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-[#0A5C75] tracking-widest uppercase">
                VACINAÇÃO ANTI-TETÂNICA (V.A.T.)
              </span>
              <div className="h-[1px] bg-[#0A5C75]/30 mt-1 w-full" />
            </div>

            <table className="w-full text-[8px] border-collapse">
              <thead>
                <tr className="border-b border-[#0A5C75]/30">
                  <th className="text-left font-bold py-1 w-20">DOSE</th>
                  <th className="text-left font-bold py-1 w-24">DATA ADM.</th>
                  <th className="text-left font-bold py-1">LOTE / LABORATÓRIO</th>
                </tr>
              </thead>
              <tbody>
                {ttDoses.map((dose) => {
                  const vac = getVaccineDose(dose.code)
                  return (
                    <tr key={dose.code} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-2 font-semibold text-neutral-700">{dose.label}</td>
                      <td className="py-2 font-mono text-neutral-900">
                        {vac?.dose_date ? formatDate(vac.dose_date) : '— — — — —'}
                      </td>
                      <td className="py-2 text-neutral-600 font-mono">
                        {vac?.lot_number ? vac.lot_number : '— — — — —'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Custom/Other vaccines list */}
            {otherVaccines.length > 0 && (
              <div className="mt-3">
                <span className="font-bold text-[7px] text-[#0A5C75] uppercase tracking-wide block mb-1">
                  OUTRAS VACINAÇÕES
                </span>
                <div className="space-y-1 text-[7px] font-mono text-neutral-600">
                  {otherVaccines.slice(0, 3).map((v, i) => (
                    <div key={i} className="flex justify-between border-b border-neutral-100 pb-0.5">
                      <span>{v.vaccine_name}</span>
                      <span>{v.dose_date ? formatDate(v.dose_date) : ''} (Lot: {v.lot_number || 'N/A'})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[7px] text-neutral-400 italic leading-tight border-t border-neutral-200 pt-2">
            A imunização activa contra o tétano é obrigatória para a emissão oficial.
          </div>
        </div>

        {/* LADO DIREITO: VISTORIAS SANITÁRIAS / CONTROLE MÉDICO */}
        <div className="booklet-border flex flex-col justify-between h-full relative">
          <div>
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-[#0A5C75] tracking-widest uppercase">
                INSPECÇÕES E VISTORIAS SANITÁRIAS
              </span>
              <div className="h-[1px] bg-[#0A5C75]/30 mt-1 w-full" />
            </div>

            <div className="space-y-2.5">
              {activeInspections.length > 0 ? (
                activeInspections.map((insp, index) => (
                  <div key={insp.id} className="text-[8px] border-b border-neutral-100 pb-1.5 last:border-b-0">
                    <div className="flex justify-between font-bold text-neutral-800">
                      <span>VISTORIA {activeInspections.length - index}ª</span>
                      <span className="font-mono text-neutral-600">{formatDate(insp.inspection_date)}</span>
                    </div>
                    <p className="text-[7px] text-neutral-600 leading-normal mt-0.5 italic">
                      Observação: {insp.observations || 'Considerado APTO para o exercício de actividade laboral.'}
                    </p>
                    {insp.next_inspection_date && (
                      <div className="text-[7px] font-semibold text-[#0A5C75] mt-0.5">
                        Próxima Vistoria: <span className="font-mono">{formatDate(insp.next_inspection_date)}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-400 italic text-[9px] font-mono border border-dashed border-neutral-200 rounded">
                  Nenhuma vistoria registada.
                </div>
              )}
            </div>
          </div>

          {/* Signatures & Stamps Box */}
          <div className="border-t border-neutral-200 pt-3 mt-4">
            <div className="grid grid-cols-2 gap-3 items-end">
              {/* Doctor signature area */}
              <div className="text-center border-r border-neutral-200 pr-2">
                <div className="h-8 flex items-center justify-center overflow-hidden mb-1">
                  {booklet.signature_url ? (
                    <img
                      src={booklet.signature_url}
                      alt="Assinatura Médica"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-12 h-[1px] bg-neutral-300 mt-5 mx-auto" />
                  )}
                </div>
                <span className="text-[7px] font-semibold text-neutral-500 uppercase block">
                  Assinatura do Clínico
                </span>
              </div>

              {/* Authority Stamp area */}
              <div className="text-center flex flex-col items-center justify-end">
                <div className="h-8 flex items-center justify-center overflow-hidden mb-1">
                  {booklet.stamp_url ? (
                    <img
                      src={booklet.stamp_url}
                      alt="Carimbo Sanitário"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-neutral-300 flex items-center justify-center">
                      <span className="text-[6px] text-neutral-400">SELO</span>
                    </div>
                  )}
                </div>
                <span className="text-[7px] font-semibold text-neutral-500 uppercase block">
                  Carimbo Oficial MINSA
                </span>
              </div>
            </div>
          </div>

          {/* Authentic background stamp overlay */}
          {booklet.stamp_url && (
            <img
              src={booklet.stamp_url}
              alt="Selo de Fundo"
              className="stamp-box pointer-events-none select-none"
            />
          )}
        </div>
      </div>
    </div>
  )
}
