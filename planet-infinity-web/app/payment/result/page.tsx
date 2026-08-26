import Link from "next/link";
import styles from "./page.module.css";

export const metadata = { title: "Payment received" };

export default function PaymentResultPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>We&apos;re checking your payment.</h1>
        <p>
          Paymob has returned you to Planet Infinity. We verify the signed payment
          notification directly with Paymob before marking anything as paid, so
          this page never makes a false confirmation.
        </p>
        <Link href="/">Back to Planet Infinity</Link>
      </section>
    </main>
  );
}
