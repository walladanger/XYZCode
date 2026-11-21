import { WebRemoteControlBrand } from "#src/web-remote-control/ui/webRemoteControlBrand.js";

export function WebRemoteControlScanPage({ locale: _locale }: { locale: "zh-CN" | "en-US" }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-sm rounded-xl border border-card-border bg-card p-5 shadow-sm">
        <WebRemoteControlBrand className="mb-2" />
        <h1 className="text-ui-lg font-medium">Scan the desktop QR code</h1>
        <p className="mt-2 text-ui-xs leading-6 text-foreground-subtle">
          Open Web remote control on your computer, then scan its QR code to connect.
        </p>
      </section>
    </main>
  );
}
