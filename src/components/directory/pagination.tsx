import Link from "next/link";
import styles from "./directory.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  pathname: string;
  searchParams?: Record<string, string | undefined>;
};

export function Pagination({
  page,
  totalPages,
  pathname,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1)
    .slice(0, 7);

  function href(targetPage: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <nav className={styles.pagination} aria-label="Catalogue pages">
      {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : null}
      {pageNumbers.map((pageNumber) => (
        <Link
          aria-current={pageNumber === page ? "page" : undefined}
          href={href(pageNumber)}
          key={pageNumber}
        >
          {pageNumber}
        </Link>
      ))}
      {page < totalPages ? <Link href={href(page + 1)}>Next</Link> : null}
    </nav>
  );
}
