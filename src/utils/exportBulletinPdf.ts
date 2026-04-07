import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ageGroups = ["RN", "1-11m", "1-4a", "5-9a", "10-14a", "15-24a", "25-49a", "50+"];

interface ExportOptions {
  bulletinNumber: string;
  healthUnit: string;
  month: string;
  year: string;
  informantName: string;
  informantCategory: string;
  observations: string;
  formData: Record<string, string>;
  diseasesPage1: { name: string; hasConfirmation?: boolean; subLabel?: { com: string; sem: string } }[];
  diseasesPage2: { name: string; hasConfirmation?: boolean; subLabel?: { com: string; sem: string } }[];
  months: string[];
  onProgress?: (step: string) => void;
}

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

type SubType = "com" | "sem" | "main";

const cellKey = (disease: string, sub: SubType, type: "cases" | "deaths", ag: string) =>
  `${disease}_${sub}_${type}_${ag}`;

const getRowTotal = (formData: Record<string, string>, disease: string, sub: SubType, type: "cases" | "deaths") =>
  ageGroups.reduce((sum, ag) => sum + (parseInt(formData[cellKey(disease, sub, type, ag)] || "0") || 0), 0);

function buildDiseaseRows(
  diseases: ExportOptions["diseasesPage1"],
  formData: Record<string, string>,
  includeDeaths: boolean
) {
  const rows: (string | number)[][] = [];

  for (const disease of diseases) {
    if (disease.hasConfirmation && disease.subLabel) {
      for (const sub of ["com", "sem"] as SubType[]) {
        const label = sub === "com"
          ? `${disease.name} - ${disease.subLabel.com}`
          : `  ${disease.subLabel.sem}`;
        const row: (string | number)[] = [label];
        ageGroups.forEach((ag) => row.push(formData[cellKey(disease.name, sub, "cases", ag)] || ""));
        row.push(getRowTotal(formData, disease.name, sub, "cases") || "");
        if (includeDeaths) {
          ageGroups.forEach((ag) => row.push(formData[cellKey(disease.name, sub, "deaths", ag)] || ""));
          row.push(getRowTotal(formData, disease.name, sub, "deaths") || "");
        }
        rows.push(row);
      }
    } else {
      const row: (string | number)[] = [disease.name];
      ageGroups.forEach((ag) => row.push(formData[cellKey(disease.name, "main", "cases", ag)] || ""));
      row.push(getRowTotal(formData, disease.name, "main", "cases") || "");
      if (includeDeaths) {
        ageGroups.forEach((ag) => row.push(formData[cellKey(disease.name, "main", "deaths", ag)] || ""));
        row.push(getRowTotal(formData, disease.name, "main", "deaths") || "");
      }
      rows.push(row);
    }
  }
  return rows;
}

export function exportBulletinPdf(options: ExportOptions): boolean {
  try {
    const { bulletinNumber, healthUnit, month, year, informantName, informantCategory, observations, formData, diseasesPage1, diseasesPage2, months, onProgress } = options;

    onProgress?.("A inicializar documento...");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const monthName = month ? months[parseInt(month) - 1] : "—";
    const primaryColor = [14, 116, 144] as [number, number, number]; // #0e7490

    // Title
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE", 148, 10, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(33, 33, 33);
    doc.text("BOLETIM DE NOTIFICAÇÃO EPIDEMIOLÓGICA MENSAL", 148, 16, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Boletim Nº: ${bulletinNumber || "—"}    Unidade Sanitária: ${healthUnit || "—"}    Mês: ${monthName}    Ano: ${year || "—"}`, 148, 22, { align: "center" });

    // Page 1 table
    onProgress?.("A gerar dados da página 1...");
    const casesHeaders = ["Doenças ou Eventos", ...ageGroups, "Total"];
    const rows1 = buildDiseaseRows(diseasesPage1, formData, false);

    autoTable(doc, {
      startY: 26,
      head: [casesHeaders],
      body: rows1,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: primaryColor, fontSize: 6 },
      columnStyles: { 0: { cellWidth: 55 } },
      theme: "grid",
    });

    // Page 2
    onProgress?.("A gerar dados da página 2...");
    doc.addPage("a4", "landscape");
    doc.setFontSize(10);
    doc.setTextColor(33, 33, 33);
    doc.text("BOLETIM DE NOTIFICAÇÃO EPIDEMIOLÓGICA — Parte 2", 148, 10, { align: "center" });

    const fullHeaders = ["Doenças ou Eventos", ...ageGroups.map(a => `C:${a}`), "Total C", ...ageGroups.map(a => `Ó:${a}`), "Total Ó"];
    const rows2 = buildDiseaseRows(diseasesPage2, formData, true);

    autoTable(doc, {
      startY: 14,
      head: [fullHeaders],
      body: rows2,
      styles: { fontSize: 5, cellPadding: 0.8 },
      headStyles: { fillColor: primaryColor, fontSize: 5 },
      columnStyles: { 0: { cellWidth: 45 } },
      theme: "grid",
    });

    // Footer info
    const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? 180;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Informante: ${informantName || "—"}    Categoria: ${informantCategory || "—"}`, 14, finalY + 8);
    if (observations) {
      doc.text(`Observações: ${observations}`, 14, finalY + 14);
    }

    onProgress?.("A guardar PDF...");
    doc.save(`Boletim_Epidemiologico_${monthName}_${year}.pdf`);
    return true;
  } catch (error) {
    console.error("Error exporting bulletin:", error);
    return false;
  }
}
