'use client';

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary min-h-11">
      Imprimir
    </button>
  );
}
