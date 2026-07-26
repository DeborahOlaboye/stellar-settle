const HERO_PREVIEW = [
  { initials: "TR", color: "#4FD1C5", name: "Théo Rousseau", amount: "+138.90", positive: true },
  { initials: "PN", color: "#E0B44A", name: "Priya Nair", amount: "-107.10", positive: false },
  { initials: "ML", color: "#7C8CF8", name: "Mara Lindqvist", amount: "-26.70", positive: false },
];

const WHY_STELLAR = [
  {
    label: "PATH PAYMENTS",
    color: "#4FD1C5",
    body: "Pay in whatever asset you hold; the receiver gets their preferred asset, converted atomically on the ledger.",
  },
  {
    label: "SUB-CENT FEES",
    color: "#7C8CF8",
    body: "Settling a $4 coffee or a $12 taxi share is worth doing when the fee doesn't eat the debt.",
  },
  {
    label: "SEP-24 ANCHORS",
    color: "#E0B44A",
    body: "Non-crypto-native members get a real path to cash out to a bank account or mobile money.",
  },
];

const HOW_IT_WORKS = [
  { n: "01", title: "Log an expense", body: "The payer logs an amount split equally among participants; remainders go to the earliest participants." },
  { n: "02", title: "Confirm or dispute", body: "Each participant acknowledges their share before it counts as a real debt." },
  { n: "03", title: "Preview settlement", body: "The contract nets balances down to the minimal set of transfers, shown before anyone signs." },
  { n: "04", title: "Settle atomically", body: "Debtors sign, transfers execute on-chain in one transaction, balances zero out." },
];

const FAQ = [
  { q: "What if someone disputes an expense?", a: "A disputed share is excluded from balances entirely — it never becomes a debt, and the payer can re-log it if it was a mistake." },
  { q: "Who has to sign to settle?", a: "Every member currently in debt authorizes their own transfer; the whole set executes as one atomic transaction." },
  { q: "Do I need to hold crypto to join a group?", a: "No — a SEP-24 anchor lets members cash in or out via a bank or mobile money account." },
];

function ConnectButton({
  connecting,
  onConnect,
  size = "md",
}: {
  connecting: boolean;
  onConnect: () => void;
  size?: "md" | "lg";
}) {
  const padding = size === "lg" ? "px-6.5 py-3.5" : "px-4 py-2.5";
  const fontSize = size === "lg" ? "text-[15px]" : "text-[13.5px]";
  if (connecting) {
    return (
      <button
        disabled
        className={`flex items-center gap-2.5 bg-border-soft text-text-dim border border-border rounded-lg ${padding} font-semibold ${fontSize} cursor-default`}
      >
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-border-strong"
          style={{ borderTopColor: "#E8734A", animation: "spin .7s linear infinite" }}
        />
        {size === "lg" ? "Waiting for approval in Freighter…" : "Connecting…"}
      </button>
    );
  }
  return (
    <button
      onClick={onConnect}
      className={`bg-accent text-bg rounded-lg ${padding} font-semibold ${fontSize} cursor-pointer hover:bg-accent-hover transition-colors`}
    >
      {size === "lg" ? "Connect Freighter Wallet" : "Connect Wallet"}
    </button>
  );
}

export function Landing({
  connecting,
  onConnect,
}: {
  connecting: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="w-full">
      {/* NAV */}
      <div className="flex items-center justify-between px-5 py-5 sm:px-12 sm:py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-accent flex-none" />
          <div className="font-mono text-[13px] tracking-[2px] uppercase">Stellar Settle</div>
        </div>
        <div className="flex items-center gap-7">
          <a href="#how-it-works" className="hidden md:inline text-sm text-text-dim">How it works</a>
          <a href="#why-stellar" className="hidden md:inline text-sm text-text-dim">Why Stellar</a>
          <a href="#faq" className="hidden md:inline text-sm text-text-dim">FAQ</a>
          <ConnectButton connecting={connecting} onConnect={onConnect} />
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-5 pt-10 pb-16 sm:px-12 sm:pt-16 sm:pb-24 flex flex-col sm:flex-row items-center gap-10 sm:gap-16">
        <div
          className="w-full flex-1 sm:min-w-[420px] flex flex-col items-start gap-6.5"
          style={{ animation: "fadeUp .5s ease" }}
        >
          <div className="font-mono text-[12.5px] tracking-[1.5px] uppercase text-accent border border-[#3D2A22] bg-[rgba(232,115,74,0.10)] px-3 py-1.5 rounded-full">
            Built on Stellar &middot; Soroban
          </div>
          <h1 className="m-0 text-[36px] sm:text-[58px] leading-[1.05] font-bold tracking-[-1px]">
            Split expenses across borders. Settle in one signature.
          </h1>
          <p className="m-0 text-[17px] leading-[1.65] text-text-dim max-w-[520px]">
            Groups log shared expenses on-chain. The contract nets every member&apos;s balance and
            collapses debts into the minimal set of transfers &mdash; executed atomically, for
            sub-cent fees.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <ConnectButton connecting={connecting} onConnect={onConnect} size="lg" />
            <div className="font-mono text-xs text-text-faint">Testnet demo &middot; no real funds move</div>
          </div>
        </div>

        <div
          className="w-full flex-1 sm:min-w-[360px] sm:max-w-[440px] bg-panel border border-border rounded-2xl p-5.5"
          style={{ animation: "fadeUp .6s ease" }}
        >
          <div className="font-mono text-[11.5px] text-text-faint mb-3.5">LISBON TRIP &middot; USDC</div>
          <div className="flex flex-col gap-2.5">
            {HERO_PREVIEW.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between bg-panel-alt border border-border-soft rounded-lg px-3.5 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6.5 h-6.5 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold text-bg"
                    style={{ background: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="text-[13.5px]">{m.name}</div>
                </div>
                <div
                  className="font-mono text-sm font-semibold"
                  style={{ color: m.positive ? "#4FD1C5" : "#E8567A" }}
                >
                  {m.amount}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3.5 pt-3.5 border-t border-border-soft font-mono text-xs text-text-faint">
            3 transfers clear this group &middot; &lt;$0.001 fee each
          </div>
        </div>
      </div>

      {/* WHY STELLAR */}
      <div id="why-stellar" className="max-w-6xl mx-auto px-5 sm:px-12 pb-22">
        <div className="font-mono text-xs tracking-[1.5px] uppercase text-text-faint mb-3">Why Stellar</div>
        <h2 className="m-0 mb-8 text-[30px] font-bold max-w-[600px]">
          The ledger does the work a group chat can&apos;t.
        </h2>
        <div className="flex gap-4 flex-wrap">
          {WHY_STELLAR.map((item) => (
            <div key={item.label} className="flex-1 min-w-[260px] bg-panel border border-border rounded-xl p-5.5">
              <div className="font-mono text-[12.5px] tracking-[0.5px] mb-2.5" style={{ color: item.color }}>
                {item.label}
              </div>
              <div className="text-[14.5px] text-text-dim leading-[1.6]">{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" className="max-w-6xl mx-auto px-5 sm:px-12 pb-24">
        <div className="font-mono text-xs tracking-[1.5px] uppercase text-text-faint mb-3">How it works</div>
        <h2 className="m-0 mb-8 text-[30px] font-bold max-w-[600px]">
          From a shared dinner to a signed settlement.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.n} className="bg-panel border border-border rounded-xl p-5.5 flex flex-col gap-2.5">
              <div className="font-mono text-[22px] text-accent font-semibold">{step.n}</div>
              <div className="text-[15px] font-semibold">{step.title}</div>
              <div className="text-[13px] text-text-dim leading-[1.55]">{step.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="max-w-6xl mx-auto px-5 sm:px-12 pb-24">
        <div className="font-mono text-xs tracking-[1.5px] uppercase text-text-faint mb-3">FAQ</div>
        <div className="flex flex-col max-w-[760px]">
          {FAQ.map((item, i) => (
            <div
              key={item.q}
              className={`py-5 border-t border-border-soft ${i === FAQ.length - 1 ? "border-b" : ""}`}
            >
              <div className="text-[15px] font-semibold mb-2">{item.q}</div>
              <div className="text-[13.5px] text-text-dim leading-[1.6]">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="max-w-6xl mx-auto px-5 sm:px-12 pt-14 pb-16 border-t border-border-soft flex items-center justify-between flex-wrap gap-5">
        <div>
          <div className="text-[22px] font-bold mb-1.5">Ready to stop chasing your friends for $12?</div>
          <div className="text-[13.5px] text-text-faint">Connect a wallet and create your first group in under a minute.</div>
        </div>
        <ConnectButton connecting={connecting} onConnect={onConnect} size="lg" />
      </div>
    </div>
  );
}
