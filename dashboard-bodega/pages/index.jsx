import React, { useState, useEffect, useMemo } from "react";

const SHEET_ID = "1MFnNFVo9qH5Bh_Crz8SIZ4Xs8DkxKi2Tix4_E0EzRNc";
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const CAT_INFO = {
  "Gasto en Cajas": { accent: "#60a5fa", label: "Cajas" },
  "Gasto en Cinta": { accent: "#fb923c", label: "Cinta" },
  "Gasto en Etiquetas": { accent: "#c084fc", label: "Etiquetas" },
  "Gasto en Film": { accent: "#2dd4bf", label: "Film" },
  "Gasto en Burbuja": { accent: "#f472b6", label: "Burbuja" },
  "Gasto en Kraft": { accent: "#a8a29e", label: "Kraft" },
  "Gasto en Bolsas Inflables": { accent: "#818cf8", label: "Bolsas" },
};

async function fetchCSV(sheet, range) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&range=${range}`;
  const res = await fetch(url);
  const text = await res.text();
  return text.split("\n").filter(r => r.trim()).map(row => {
    const cells = [];
    let current = "", inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    cells.push(current.trim());
    return cells.map(c => { const n = Number(c); return c === "" ? null : isNaN(n) ? c : n; });
  });
}

const fN = n => (n == null || isNaN(n)) ? "—" : "$" + Math.round(n).toLocaleString("es-CL");
const fU = n => (n == null || isNaN(n) || n === 0) ? "—" : Math.round(n).toLocaleString("es-CL");
const fPct = n => (n == null || isNaN(n) || n === 0) ? "—" : Math.round(n * 100) + "%";

const devColor = val => {
  if (val == null || isNaN(val)) return { bg: "transparent", text: "#475569" };
  if (val >= 1.5) return { bg: "#166534", text: "#fff" };
  if (val >= 1.15) return { bg: "#22c55e", text: "#fff" };
  if (val >= 0.85) return { bg: "rgba(34,197,94,0.12)", text: "#22c55e" };
  if (val >= 0.5) return { bg: "rgba(239,68,68,0.15)", text: "#ef4444" };
  return { bg: "#991b1b", text: "#fff" };
};

const maxInArr = (rows, colIdx) => {
  let mx = 0;
  rows.forEach(r => { if (r[colIdx] != null && !isNaN(r[colIdx]) && r[colIdx] > mx) mx = r[colIdx]; });
  return mx;
};

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selMonth, setSelMonth] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [consumo, desv, gastoCat, gastoTot, gastoDia, gastoMes, ordenes, cpo] = await Promise.all([
          fetchCSV("Consumo LP", "A4:M20"),
          fetchCSV("Consumo LP", "A25:M41"),
          fetchCSV("Gasto", "A44:M50"),
          fetchCSV("Gasto", "A52:M52"),
          fetchCSV("Gasto", "A55:M55"),
          fetchCSV("Gasto", "A56:M56"),
          fetchCSV("Gasto", "A58:M58"),
          fetchCSV("Gasto", "A59:M59"),
        ]);

        const mesesConData = [];
        for (let m = 0; m < 12; m++) {
          if (consumo.some(r => r[m + 1] != null && r[m + 1] !== 0)) mesesConData.push(m);
        }

        setD({ consumo, desv, gastoCat, gastoTot: gastoTot[0] || [], gastoDia: gastoDia[0] || [], gastoMes: gastoMes[0] || [], ordenes: ordenes[0] || [], cpo: cpo[0] || [], mesesConData });
        setSelMonth(mesesConData.length > 0 ? mesesConData[mesesConData.length - 1] : 0);
      } catch (e) {
        setErr("No se pudo cargar. Verifica que el Sheet esté compartido como público.");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={S.center}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
      <div style={{ fontSize: 13, letterSpacing: 3, color: "#64748b", fontFamily: "monospace" }}>CARGANDO...</div>
    </div>
  );
  if (err) return <div style={S.center}><div style={{ color: "#ef4444", maxWidth: 400, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>{err}</div></div>;
  if (!d) return null;

  const m = selMonth;
  const gTotal = d.gastoTot[m + 1] || 0;
  const gDia = d.gastoDia[m + 1] || 0;
  const gMes = d.gastoMes[m + 1] || 0;
  const ords = d.ordenes[m + 1] || 0;
  const cpov = d.cpo[m + 1] || 0;

  // Sort categories by value for the selected month
  const catSorted = [...d.gastoCat].filter(r => CAT_INFO[r[0]]).sort((a, b) => (b[m + 1] || 0) - (a[m + 1] || 0));

  // Filter consumo rows with data
  const consumoFiltered = d.consumo.filter(r => r[m + 1] != null && r[m + 1] !== 0);
  const consumoSorted = [...consumoFiltered].sort((a, b) => (b[m + 1] || 0) - (a[m + 1] || 0));
  const maxConsumo = maxInArr(consumoSorted, m + 1);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0b0f1a", color: "#cbd5e1", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderBottom: "1px solid #1e293b", padding: "20px 24px" }}>
        <div style={S.container}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#475569", fontWeight: 600 }}>GESTIÓN DE INSUMOS · D2C</div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: "2px 0 0", color: "#f1f5f9", letterSpacing: -0.5 }}>Bodega Las Parcelas</h1>
            </div>
            <div style={{ display: "flex", gap: 3, background: "#0f172a", borderRadius: 8, padding: 3, border: "1px solid #1e293b" }}>
              {d.mesesConData.map(mi => (
                <button key={mi} onClick={() => setSelMonth(mi)} style={{
                  ...S.monthBtn,
                  background: mi === m ? "#3b82f6" : "transparent",
                  color: mi === m ? "#fff" : "#475569",
                }}>
                  {MESES[mi]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 24px 40px" }}>
        <div style={S.container}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 28 }}>
            {[
              { l: "Gasto por Consumo", v: fN(gTotal), c: "#3b82f6", sub: MESES[m] },
              { l: "Gasto Diario", v: fN(gDia), c: "#22c55e", sub: "promedio" },
              { l: "Gasto Mensual", v: fN(gMes), c: "#f59e0b", sub: "30 días" },
              { l: "Pedidos", v: fU(ords), c: "#a855f7", sub: "del periodo" },
              { l: "CPO", v: fN(cpov), c: "#ec4899", sub: "costo/pedido" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#111827", borderRadius: 10, padding: "16px 14px", border: "1px solid #1e293b", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: k.c }} />
                <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>{k.l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, fontFamily: "'JetBrains Mono', monospace", color: k.c }}>{k.v}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

            {/* GASTO POR CATEGORÍA */}
            <div style={S.card}>
              <h2 style={S.sectionTitle}>Gasto por Categoría</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {catSorted.map((row, i) => {
                  const info = CAT_INFO[row[0]];
                  const val = row[m + 1] || 0;
                  const pct = gTotal > 0 ? val / gTotal : 0;
                  const maxVal = catSorted[0]?.[m + 1] || 1;
                  const barW = maxVal > 0 ? (val / maxVal * 100) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: info.accent }}>{info.label}</span>
                        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: "#94a3b8" }}>
                          {fN(val)} <span style={{ color: "#475569", fontSize: 10 }}>({Math.round(pct * 100)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barW}%`, background: info.accent, borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONSUMO TOP */}
            <div style={S.card}>
              <h2 style={S.sectionTitle}>Consumo por SKU</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {consumoSorted.slice(0, 12).map((row, i) => {
                  const sku = row[0];
                  const val = row[m + 1] || 0;
                  const idx = d.consumo.indexOf(row);
                  const dev = d.desv[idx]?.[m + 1];
                  const dc = devColor(dev);
                  const barW = maxConsumo > 0 ? (val / maxConsumo * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 160, fontSize: 11, fontWeight: 500, color: "#94a3b8", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku}</div>
                      <div style={{ flex: 1, height: 14, background: "#1e293b", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                        <div style={{ height: "100%", width: `${barW}%`, background: "rgba(59,130,246,0.3)", borderRadius: 3 }} />
                        <span style={{ position: "absolute", right: 6, top: 0, fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#94a3b8", lineHeight: "14px" }}>{fU(val)}</span>
                      </div>
                      <div style={{ width: 48, textAlign: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: dc.bg, color: dc.text }}>{fPct(dev)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12, fontSize: 9, color: "#475569", flexWrap: "wrap", justifyContent: "center" }}>
                {[["#991b1b","<50%"],["rgba(239,68,68,0.15)","50-85%"],["rgba(34,197,94,0.12)","85-115%"],["#22c55e","115-150%"],["#166534",">150%"]].map(([bg, label], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: bg, border: "1px solid #334155" }} />{label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* EVOLUCIÓN MENSUAL */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>Evolución Mensual</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, position: "sticky", left: 0, background: "#111827", zIndex: 1 }}></th>
                    {d.mesesConData.map(mi => (
                      <th key={mi} style={{ ...S.th, color: mi === m ? "#3b82f6" : "#475569", background: mi === m ? "rgba(59,130,246,0.06)" : "transparent" }}>{MESES[mi]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catSorted.map((row, i) => {
                    const info = CAT_INFO[row[0]];
                    return (
                      <tr key={i}>
                        <td style={{ ...S.td, position: "sticky", left: 0, background: "#111827", zIndex: 1, fontWeight: 600, color: info.accent, fontSize: 11 }}>
                          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: info.accent, marginRight: 6 }} />{info.label}
                        </td>
                        {d.mesesConData.map(mi => (
                          <td key={mi} style={{ ...S.tdNum, background: mi === m ? "rgba(59,130,246,0.06)" : "transparent", fontWeight: mi === m ? 600 : 400 }}>
                            {(row[mi + 1] || 0) > 0 ? fN(row[mi + 1]) : "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "2px solid #1e293b" }}>
                    <td style={{ ...S.td, position: "sticky", left: 0, background: "#111827", zIndex: 1, fontWeight: 700, color: "#f1f5f9" }}>Total</td>
                    {d.mesesConData.map(mi => (
                      <td key={mi} style={{ ...S.tdNum, fontWeight: 700, color: "#3b82f6", background: mi === m ? "rgba(59,130,246,0.06)" : "transparent" }}>
                        {(d.gastoTot[mi + 1] || 0) > 0 ? fN(d.gastoTot[mi + 1]) : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ ...S.td, position: "sticky", left: 0, background: "#111827", zIndex: 1, color: "#64748b" }}>Pedidos</td>
                    {d.mesesConData.map(mi => (
                      <td key={mi} style={{ ...S.tdNum, color: "#a855f7", background: mi === m ? "rgba(59,130,246,0.06)" : "transparent" }}>
                        {(d.ordenes[mi + 1] || 0) > 0 ? fU(d.ordenes[mi + 1]) : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ ...S.td, position: "sticky", left: 0, background: "#111827", zIndex: 1, color: "#64748b" }}>CPO</td>
                    {d.mesesConData.map(mi => (
                      <td key={mi} style={{ ...S.tdNum, color: "#ec4899", background: mi === m ? "rgba(59,130,246,0.06)" : "transparent" }}>
                        {(d.cpo[mi + 1] || 0) > 0 ? fN(d.cpo[mi + 1]) : "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "24px 0 0", color: "#1e293b", fontSize: 10, letterSpacing: 2 }}>
            DATOS EN TIEMPO REAL DESDE GOOGLE SHEETS
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0b0f1a", color: "#cbd5e1" },
  container: { maxWidth: 1100, margin: "0 auto" },
  card: { background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #1e293b" },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 16px" },
  monthBtn: { padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans'", transition: "all 0.15s" },
  th: { padding: "10px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, letterSpacing: 1, borderBottom: "1px solid #1e293b" },
  td: { padding: "8px 12px", borderBottom: "1px solid #0f172a" },
  tdNum: { padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#94a3b8", borderBottom: "1px solid #0f172a" },
};
