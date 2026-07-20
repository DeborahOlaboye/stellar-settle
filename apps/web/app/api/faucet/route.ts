import { NextRequest, NextResponse } from "next/server";
import { StrKey, Keypair } from "@stellar/stellar-sdk";
import { createTokenClient } from "@/lib/stellar/clients";
import { keypairSigner } from "@/lib/stellar/serverSigner";
import { toRawAmount } from "@/lib/stellar/format";

const MAX_AMOUNT = "1000";

export async function POST(req: NextRequest) {
  const { address, amount } = await req.json();

  if (typeof address !== "string" || !StrKey.isValidEd25519PublicKey(address)) {
    return NextResponse.json({ error: "Invalid Stellar address" }, { status: 400 });
  }
  if (typeof amount !== "string" || !/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0 || Number(amount) > Number(MAX_AMOUNT)) {
    return NextResponse.json({ error: `Amount must be between 0 and ${MAX_AMOUNT}` }, { status: 400 });
  }

  const issuerSecret = process.env.TOKEN_ISSUER_SECRET;
  if (!issuerSecret) {
    return NextResponse.json({ error: "Faucet not configured" }, { status: 500 });
  }

  const issuerPublicKey = Keypair.fromSecret(issuerSecret).publicKey();
  const client = createTokenClient(issuerPublicKey);
  client.options.signTransaction = keypairSigner(issuerSecret);

  const tx = await client.mint({ to: address, amount: toRawAmount(amount) });
  await tx.signAndSend();

  return NextResponse.json({ ok: true });
}
