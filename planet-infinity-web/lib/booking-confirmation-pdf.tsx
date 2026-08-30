import "server-only";

import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

export type BookingConfirmationPdfData = {
  bookingNumber: string;
  bookingStatus: string;
  paymentStatus: string;
  issuedAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  additionalGuests: string[];
  productType: "Trip" | "Event";
  productTitle: string;
  destination?: string | null;
  scheduledAt?: string | null;
  returnAt?: string | null;
  duration?: string | null;
  meetingPoint?: string | null;
  departurePoint?: string | null;
  returnPoint?: string | null;
  packageLabel?: string | null;
  inclusions: string[];
  exclusions: string[];
  paidExtras: { label: string; amount: number }[];
  accommodation?: string | null;
  transportation?: string | null;
  seatNumbers?: number[];
  guestCount: number;
  totalAmount: number;
  amountPaid: number;
  currency: string;
  siteUrl: string;
};

const colors = {
  ink: "#0D2430",
  ivory: "#FFF9F0",
  orange: "#FF8A1F",
  flame: "#F0442B",
  cyan: "#028BB4",
  soft: "#59707C",
  line: "#D8E1E5",
  white: "#FFFFFF",
  green: "#237443",
};

const styles = StyleSheet.create({
  page: {
    padding: 28,
    paddingBottom: 40,
    backgroundColor: colors.ivory,
    color: colors.ink,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    color: colors.white,
    backgroundColor: colors.orange,
    fontSize: 25,
    textAlign: "center",
    paddingTop: 1,
  },
  brandName: { fontFamily: "Helvetica-Bold", fontSize: 15 },
  brandSub: { color: colors.cyan, fontSize: 7, letterSpacing: 1.4 },
  reference: { textAlign: "right" },
  referenceLabel: { color: colors.soft, fontSize: 7, letterSpacing: 1.2 },
  referenceValue: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  hero: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.ink,
    color: colors.white,
    marginBottom: 10,
  },
  kicker: { color: colors.orange, fontSize: 8, letterSpacing: 1.5, marginBottom: 8 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 24, lineHeight: 1.02, maxWidth: 410 },
  lede: { color: "#DCE8EC", fontSize: 9, marginTop: 8, maxWidth: 430 },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  status: {
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  section: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  sectionKicker: { color: colors.flame, fontSize: 7, letterSpacing: 1.2, marginBottom: 4 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 14, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { width: "48%", minHeight: 28 },
  wideField: { width: "100%", minHeight: 28 },
  label: { color: colors.soft, fontSize: 7, letterSpacing: 0.8, marginBottom: 3 },
  value: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  columns: { flexDirection: "row", gap: 12 },
  column: { flexGrow: 1, width: "48%" },
  listItem: { flexDirection: "row", gap: 6, marginBottom: 5 },
  bulletIn: { color: colors.green, fontFamily: "Helvetica-Bold" },
  bulletOut: { color: colors.flame, fontFamily: "Helvetica-Bold" },
  paidExtra: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  paidExtraLast: { borderBottomWidth: 0 },
  paidExtraAmount: { color: colors.green, fontFamily: "Helvetica-Bold" },
  notice: {
    marginTop: 10,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "#E7F5FA",
    color: colors.ink,
  },
  noticeTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  legalLink: { color: colors.cyan, textDecoration: "none" },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    color: colors.soft,
    fontSize: 7,
  },
});

function formatDate(value?: string | null) {
  if (!value) return "To be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  }).format(date);
}

function money(value: number, currency: string) {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function PageFooter({ bookingNumber }: { bookingNumber: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Planet Infinity Entertainment · Booking Confirmation</Text>
      <Text>{bookingNumber}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function BookingConfirmationDocument({ data }: { data: BookingConfirmationPdfData }) {
  const balance = Math.max(0, data.totalAmount - data.amountPaid);
  const policiesUrl = `${data.siteUrl.replace(/\/$/, "")}/policies`;

  return (
    <Document
      title={`Booking Confirmation ${data.bookingNumber}`}
      author="Planet Infinity Entertainment"
      subject={data.productTitle}
      creator="Planet Infinity Admin"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <View style={styles.brand}>
            <Text style={styles.mark}>∞</Text>
            <View>
              <Text style={styles.brandName}>Planet Infinity</Text>
              <Text style={styles.brandSub}>ENTERTAINMENT</Text>
            </View>
          </View>
          <View style={styles.reference}>
            <Text style={styles.referenceLabel}>BOOKING REFERENCE</Text>
            <Text style={styles.referenceValue}>{data.bookingNumber}</Text>
          </View>
        </View>

        <View style={styles.hero} wrap={false}>
          <Text style={styles.kicker}>BOOKING CONFIRMATION</Text>
          <Text style={styles.title}>Your {data.productType.toLowerCase()} is confirmed.</Text>
          <Text style={styles.lede}>
            Keep this document with you. It contains the confirmed booking,
            guest, payment, meeting and travel details supplied by Planet Infinity.
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.status}>Booking · {data.bookingStatus}</Text>
            <Text style={styles.status}>Payment · {data.paymentStatus}</Text>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionKicker}>GUEST DETAILS</Text>
          <Text style={styles.sectionTitle}>Who is travelling</Text>
          <View style={styles.grid}>
            <View style={styles.field}><Text style={styles.label}>PRIMARY GUEST</Text><Text style={styles.value}>{data.guestName}</Text></View>
            <View style={styles.field}><Text style={styles.label}>GUESTS</Text><Text style={styles.value}>{data.guestCount}</Text></View>
            <View style={styles.field}><Text style={styles.label}>EMAIL</Text><Text style={styles.value}>{data.guestEmail}</Text></View>
            <View style={styles.field}><Text style={styles.label}>MOBILE / WHATSAPP</Text><Text style={styles.value}>{data.guestPhone || "Not provided"}</Text></View>
            {data.additionalGuests.length ? (
              <View style={styles.wideField}>
                <Text style={styles.label}>ADDITIONAL GUESTS</Text>
                <Text style={styles.value}>{data.additionalGuests.join(" · ")}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionKicker}>{data.productType.toUpperCase()} DETAILS</Text>
          <Text style={styles.sectionTitle}>{data.productTitle}</Text>
          <View style={styles.grid}>
            <View style={styles.field}><Text style={styles.label}>DESTINATION / VENUE</Text><Text style={styles.value}>{data.destination || "To be confirmed"}</Text></View>
            <View style={styles.field}><Text style={styles.label}>PACKAGE</Text><Text style={styles.value}>{data.packageLabel || "Standard booking"}</Text></View>
            <View style={styles.field}><Text style={styles.label}>DEPARTURE / START</Text><Text style={styles.value}>{formatDate(data.scheduledAt)}</Text></View>
            <View style={styles.field}><Text style={styles.label}>RETURN / END</Text><Text style={styles.value}>{formatDate(data.returnAt)}</Text></View>
            <View style={styles.field}><Text style={styles.label}>DURATION</Text><Text style={styles.value}>{data.duration || "To be confirmed"}</Text></View>
            <View style={styles.field}><Text style={styles.label}>{(data.seatNumbers?.length ?? 0) === 1 ? "SEAT" : "SEATS"}</Text><Text style={styles.value}>{data.seatNumbers?.length ? data.seatNumbers.map((seat) => `Seat ${seat}`).join(" · ") : "Not assigned"}</Text></View>
            <View style={styles.wideField}><Text style={styles.label}>MEETING POINT</Text><Text style={styles.value}>{data.meetingPoint || data.departurePoint || "To be confirmed"}</Text></View>
          </View>
        </View>
        <PageFooter bookingNumber={data.bookingNumber} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <View><Text style={styles.sectionKicker}>PACKAGE SCOPE</Text><Text style={styles.sectionTitle}>What your booking contains</Text></View>
          <Text style={styles.referenceValue}>{data.bookingNumber}</Text>
        </View>

        {data.paidExtras.length ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionKicker}>PAID EXTRAS</Text>
            <Text style={styles.sectionTitle}>Included in your booking</Text>
            {data.paidExtras.map((item, index) => (
              <View key={`${item.label}-${index}`} style={[styles.paidExtra, index === data.paidExtras.length - 1 ? styles.paidExtraLast : {}]}>
                <Text>{item.label}</Text>
                <Text style={styles.paidExtraAmount}>{money(item.amount, data.currency)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section} wrap={false}>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.sectionKicker}>INCLUDED</Text>
              <Text style={styles.sectionTitle}>Covered</Text>
              {data.inclusions.length ? data.inclusions.map((item) => (
                <View key={item} style={styles.listItem}><Text style={styles.bulletIn}>✓</Text><Text>{item}</Text></View>
              )) : <Text>Refer to the written trip or event offer.</Text>}
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionKicker}>NOT INCLUDED</Text>
              <Text style={styles.sectionTitle}>Not selected</Text>
              {data.exclusions.length ? data.exclusions.map((item) => (
                <View key={item} style={styles.listItem}><Text style={styles.bulletOut}>—</Text><Text>{item}</Text></View>
              )) : <Text>Anything not expressly listed as included.</Text>}
            </View>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionKicker}>TRAVEL SERVICES</Text>
          <Text style={styles.sectionTitle}>Confirmed arrangements</Text>
          <View style={styles.grid}>
            <View style={styles.wideField}><Text style={styles.label}>ACCOMMODATION</Text><Text style={styles.value}>{data.accommodation || "Not included or separately advised"}</Text></View>
            <View style={styles.wideField}><Text style={styles.label}>TRANSPORTATION</Text><Text style={styles.value}>{data.transportation || "As described in the confirmed offer"}</Text></View>
            <View style={styles.field}><Text style={styles.label}>DEPARTURE POINT</Text><Text style={styles.value}>{data.departurePoint || data.meetingPoint || "To be confirmed"}</Text></View>
            <View style={styles.field}><Text style={styles.label}>RETURN POINT</Text><Text style={styles.value}>{data.returnPoint || "To be confirmed"}</Text></View>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionKicker}>PAYMENT</Text>
          <Text style={styles.sectionTitle}>Payment summary</Text>
          <View style={styles.grid}>
            <View style={styles.field}><Text style={styles.label}>TOTAL</Text><Text style={styles.value}>{money(data.totalAmount, data.currency)}</Text></View>
            <View style={styles.field}><Text style={styles.label}>PAID</Text><Text style={styles.value}>{money(data.amountPaid, data.currency)}</Text></View>
            <View style={styles.field}><Text style={styles.label}>REMAINING</Text><Text style={styles.value}>{money(balance, data.currency)}</Text></View>
            <View style={styles.field}><Text style={styles.label}>ISSUED</Text><Text style={styles.value}>{formatDate(data.issuedAt)}</Text></View>
          </View>
        </View>
        <PageFooter bookingNumber={data.bookingNumber} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <View><Text style={styles.sectionKicker}>BEFORE YOU TRAVEL</Text><Text style={styles.sectionTitle}>Important information</Text></View>
          <Text style={styles.referenceValue}>{data.bookingNumber}</Text>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Please arrive early</Text>
          <Text>
            Arrive at the confirmed meeting point at least 15 minutes before the
            departure time. Late arrival may be treated as a no-show where the
            group cannot wait without disrupting the trip.
          </Text>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Your accepted policies</Text>
          <Text>
            This booking is governed by the policy versions accepted with the
            original request: Booking Terms, Payment, Cancellation & Refund,
            Trip Etiquette, Terms & Conditions and Privacy.
          </Text>
          <Text style={{ marginTop: 9 }}>
            Current published copies: <Link style={styles.legalLink} src={policiesUrl}>{policiesUrl}</Link>
          </Text>
        </View>

        <View style={styles.notice} wrap={false}>
          <Text style={styles.noticeTitle}>Keep the booking reference with you</Text>
          <Text>
            Quote {data.bookingNumber} whenever you contact Planet Infinity.
            If an operational detail changes, the team will issue the updated
            information in writing.
          </Text>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionKicker}>FINAL CONFIRMATION</Text>
          <Text style={styles.sectionTitle}>You are booked.</Text>
          <Text>
            Planet Infinity has recorded full payment and confirmed the services
            listed in this document. We look forward to travelling with you.
          </Text>
        </View>
        <PageFooter bookingNumber={data.bookingNumber} />
      </Page>
    </Document>
  );
}

export async function renderBookingConfirmationPdf(data: BookingConfirmationPdfData) {
  return renderToBuffer(<BookingConfirmationDocument data={data} />);
}
