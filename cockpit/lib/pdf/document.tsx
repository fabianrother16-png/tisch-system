import { Document, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { CompanySettings, InvoicingSettings } from "../settings";
import { computeTotals, lineNet, type LineItem } from "../domain/totals";
import { eur, fmtDate } from "../format";

export type PdfDocumentData = {
  kind: "angebot" | "rechnung" | "storno";
  number: string;
  title: string;
  issueDate: string;
  validUntil?: string | null;
  dueDate?: string | null;
  serviceFrom?: string | null;
  serviceTo?: string | null;
  referenceNumber?: string | null;
  intro?: string | null;
  outro?: string | null;
  discountPercent: number;
  items: LineItem[];
  customer: {
    number: string;
    name: string;
    contactName?: string | null;
    street?: string | null;
    zip?: string | null;
    city?: string | null;
    country?: string | null;
    vatId?: string | null;
  };
  company: CompanySettings;
  invoicing: InvoicingSettings;
  draft?: boolean;
};

const mm = (v: number) => v * 2.8346;

export function pdfStyles(accent: string) {
  return StyleSheet.create({
    page: { paddingTop: mm(18), paddingBottom: mm(32), paddingLeft: mm(25), paddingRight: mm(20), fontFamily: "Helvetica", fontSize: 9.5, color: "#1E1A17", lineHeight: 1.4 },
    brand: { position: "absolute", top: mm(13), right: mm(20), flexDirection: "row", alignItems: "center" },
    brandText: { marginLeft: 8 },
    brandName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#1B1814", letterSpacing: 1.2 },
    brandSub: { fontSize: 9, fontFamily: "Times-Italic", color: accent, marginTop: 2 },
    senderLine: { position: "absolute", top: mm(45), left: mm(25), fontSize: 7, color: "#6F665D", textDecoration: "underline" },
    address: { position: "absolute", top: mm(51), left: mm(25), width: mm(85), fontSize: 10 },
    info: { position: "absolute", top: mm(50), right: mm(20), width: mm(70) },
    infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
    infoLabel: { color: "#6F665D", fontSize: 8.5 },
    infoValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
    body: { marginTop: mm(85) },
    title: { fontSize: 19, fontFamily: "Times-Roman", marginBottom: 10, color: "#1B1814" },
    paragraph: { marginBottom: 10 },
    tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: accent, paddingBottom: 4, marginTop: 6, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
    row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#D8D1C3", paddingVertical: 5 },
    cPos: { width: "6%" },
    cDesc: { width: "44%", paddingRight: 6 },
    cQty: { width: "11%", textAlign: "right" },
    cUnit: { width: "11%", paddingLeft: 6 },
    cPrice: { width: "14%", textAlign: "right" },
    cTotal: { width: "14%", textAlign: "right" },
    itemDesc: { fontSize: 8, color: "#6F665D", marginTop: 1 },
    totals: { marginTop: 8, marginLeft: "auto", width: mm(75) },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    grand: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: accent, marginTop: 3, paddingTop: 4, fontFamily: "Helvetica-Bold", fontSize: 11 },
    footer: { position: "absolute", bottom: mm(10), left: mm(25), right: mm(20), borderTopWidth: 0.5, borderTopColor: "#D8D1C3", paddingTop: 6, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#6F665D" },
    footerCol: { width: "22%" },
    footerColWide: { width: "31%" },
    draft: { position: "absolute", top: mm(130), left: mm(40), fontSize: 80, color: accent, opacity: 0.08, transform: "rotate(-30deg)", fontFamily: "Helvetica-Bold" },
    pageNumber: { position: "absolute", bottom: mm(5), right: mm(20), fontSize: 7, color: "#6F665D" },
  });
}

export function DocumentPdf({ data }: { data: PdfDocumentData }) {
  const s = pdfStyles(data.company.accentColor || "#7A5C33");
  const { company, invoicing, customer } = data;
  const sign = data.kind === "storno" ? -1 : 1;
  const totals = computeTotals(data.items, data.discountPercent, invoicing.kleinunternehmer);
  const heading =
    data.kind === "angebot" ? `Angebot ${data.number}` : data.kind === "storno" ? `Stornorechnung ${data.number}` : `Rechnung ${data.number}`;
  const legalName = [company.name, company.legalForm].filter(Boolean).join(" ");
  const fill = (t: string) => t.replace(/\{\{\s*faellig\s*\}\}/g, fmtDate(data.dueDate)).replace(/\{\{\s*gueltig_bis\s*\}\}/g, fmtDate(data.validUntil));
  const greeting = customer.contactName ? `Hallo ${customer.contactName},` : "Sehr geehrte Damen und Herren,";

  return (
    <Document title={heading} author={legalName} creator={`${company.name} Cockpit`}>
      <Page size="A4" style={s.page}>
        {data.draft && <Text style={s.draft} fixed>ENTWURF</Text>}
        <View style={s.brand} fixed>
          <Svg viewBox="0 0 1012 573" style={{ width: 30, height: 17 }}>
            <Path d="M0 10H402A187 187 0 0 1 455 374L644 573H484L190 266H402A71 71 0 0 0 402 124H95Z" fill={company.accentColor || "#7A5C33"} />
            <Path d="M95 268L222 393V573H95Z" fill={company.accentColor || "#7A5C33"} />
            <Path d="M610 219L695 300L1012 0V572H890V271L695 452L569 326A210 210 0 0 0 610 219Z" fill={company.accentColor || "#7A5C33"} />
          </Svg>
          <View style={s.brandText}>
            <Text style={s.brandName}>{company.name.toUpperCase()}</Text>
            {company.claim ? <Text style={s.brandSub}>{company.claim}</Text> : company.website ? <Text style={s.brandSub}>{company.website.replace(/^https?:\/\//, "")}</Text> : null}
          </View>
        </View>
        <Text style={s.senderLine}>
          {[legalName, company.street, [company.zip, company.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
        </Text>
        <View style={s.address}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{customer.name}</Text>
          {customer.contactName ? <Text>z. Hd. {customer.contactName}</Text> : null}
          {customer.street ? <Text>{customer.street}</Text> : null}
          {customer.zip || customer.city ? <Text>{[customer.zip, customer.city].filter(Boolean).join(" ")}</Text> : null}
          {customer.country && customer.country !== "Deutschland" ? <Text>{customer.country}</Text> : null}
        </View>
        <View style={s.info}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>{data.kind === "angebot" ? "Angebotsnummer" : "Rechnungsnummer"}</Text>
            <Text style={s.infoValue}>{data.number}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Datum</Text>
            <Text style={s.infoValue}>{fmtDate(data.issueDate)}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Kundennummer</Text>
            <Text style={s.infoValue}>{customer.number}</Text>
          </View>
          {data.kind !== "angebot" && (data.serviceFrom || data.serviceTo) ? (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Leistungszeitraum</Text>
              <Text style={s.infoValue}>
                {data.serviceFrom && data.serviceTo && data.serviceFrom !== data.serviceTo
                  ? `${fmtDate(data.serviceFrom)} – ${fmtDate(data.serviceTo)}`
                  : fmtDate(data.serviceFrom ?? data.serviceTo)}
              </Text>
            </View>
          ) : data.kind !== "angebot" ? (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Leistungsdatum</Text>
              <Text style={s.infoValue}>entspricht Rechnungsdatum</Text>
            </View>
          ) : null}
          {data.kind === "angebot" && data.validUntil ? (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Gültig bis</Text>
              <Text style={s.infoValue}>{fmtDate(data.validUntil)}</Text>
            </View>
          ) : null}
          {data.kind === "rechnung" && data.dueDate ? (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Zahlbar bis</Text>
              <Text style={s.infoValue}>{fmtDate(data.dueDate)}</Text>
            </View>
          ) : null}
          {data.referenceNumber ? (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>{data.kind === "storno" ? "Storno zu" : "Bezug"}</Text>
              <Text style={s.infoValue}>{data.referenceNumber}</Text>
            </View>
          ) : null}
          {customer.vatId ? (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>USt-IdNr. Kunde</Text>
              <Text style={s.infoValue}>{customer.vatId}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.body}>
          <Text style={s.title}>{heading}</Text>
          {data.title ? <Text style={[s.paragraph, { fontFamily: "Helvetica-Bold" }]}>{data.title}</Text> : null}
          <Text style={s.paragraph}>{greeting}</Text>
          {data.intro ? <Text style={s.paragraph}>{fill(data.intro)}</Text> : null}

          <View style={s.tableHead} fixed>
            <Text style={s.cPos}>Pos.</Text>
            <Text style={s.cDesc}>Beschreibung</Text>
            <Text style={s.cQty}>Menge</Text>
            <Text style={s.cUnit}>Einheit</Text>
            <Text style={s.cPrice}>Einzelpreis</Text>
            <Text style={s.cTotal}>Gesamt</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={s.cPos}>{i + 1}</Text>
              <View style={s.cDesc}>
                <Text>
                  {item.title}
                  {item.optional ? " (optional)" : ""}
                </Text>
                {item.description ? <Text style={s.itemDesc}>{item.description}</Text> : null}
              </View>
              <Text style={s.cQty}>{item.quantity.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</Text>
              <Text style={s.cUnit}>{item.unit}</Text>
              <Text style={s.cPrice}>{eur(sign * item.unitPrice)}</Text>
              <Text style={s.cTotal}>{eur(sign * lineNet(item))}</Text>
            </View>
          ))}

          <View style={s.totals} wrap={false}>
            {totals.discount > 0 ? (
              <>
                <View style={s.totalRow}>
                  <Text>Zwischensumme</Text>
                  <Text>{eur(sign * totals.subtotal)}</Text>
                </View>
                <View style={s.totalRow}>
                  <Text>Rabatt {data.discountPercent.toLocaleString("de-DE")} %</Text>
                  <Text>{eur(-sign * totals.discount)}</Text>
                </View>
              </>
            ) : null}
            <View style={s.totalRow}>
              <Text>Summe netto</Text>
              <Text>{eur(sign * totals.net)}</Text>
            </View>
            {!invoicing.kleinunternehmer &&
              totals.byRate
                .filter((r) => r.rate > 0)
                .map((r) => (
                  <View key={r.rate} style={s.totalRow}>
                    <Text>zzgl. {r.rate} % USt. auf {eur(sign * r.net)}</Text>
                    <Text>{eur(sign * r.tax)}</Text>
                  </View>
                ))}
            <View style={s.grand}>
              <Text>{data.kind === "angebot" ? "Angebotssumme" : "Gesamtbetrag"}</Text>
              <Text>{eur(sign * totals.gross)}</Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }} wrap={false}>
            {invoicing.kleinunternehmer ? (
              <Text style={[s.paragraph, { fontSize: 8.5 }]}>Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.</Text>
            ) : null}
            {data.kind === "storno" ? (
              <Text style={s.paragraph}>Diese Stornorechnung hebt die Rechnung {data.referenceNumber} vollständig auf.</Text>
            ) : null}
            {data.outro ? <Text style={s.paragraph}>{fill(data.outro)}</Text> : null}
            <Text>Mit freundlichen Grüßen</Text>
            <Text>{company.owners || legalName}</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <View style={s.footerCol}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: "#1E1A17" }}>{legalName}</Text>
            {company.street ? <Text>{company.street}</Text> : null}
            <Text>{[company.zip, company.city].filter(Boolean).join(" ")}</Text>
          </View>
          <View style={s.footerCol}>
            {company.owners ? <Text>Gesellschafter: {company.owners}</Text> : null}
            {company.phone ? <Text>Tel. {company.phone}</Text> : null}
            {company.email ? <Text>{company.email}</Text> : null}
          </View>
          <View style={s.footerCol}>
            {company.taxNumber ? <Text>Steuernr.: {company.taxNumber}</Text> : null}
            {company.vatId ? <Text>USt-IdNr.: {company.vatId}</Text> : null}
          </View>
          <View style={s.footerColWide}>
            {company.bankName ? <Text>{company.bankName}</Text> : null}
            {company.iban ? <Text>IBAN: {company.iban}</Text> : null}
            {company.bic ? <Text>BIC: {company.bic}</Text> : null}
          </View>
        </View>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Seite ${pageNumber} von ${totalPages}` : "")} fixed />
      </Page>
    </Document>
  );
}

export async function renderDocumentPdf(data: PdfDocumentData): Promise<Buffer> {
  return renderToBuffer(<DocumentPdf data={data} />);
}
