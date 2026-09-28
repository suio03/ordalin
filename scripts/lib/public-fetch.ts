import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { assertPublicHttpsUrl } from "../../src/lib/catalog-enrichment/url-policy.ts";

function privateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [first, second] = octets;
  return first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19));
}
function privateIpv6(address: string) {
  const normalized = address.toLowerCase().split("%", 1)[0];
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized)?.[1];
  if (mapped) return privateIpv4(mapped);
  return normalized === "::" || normalized === "::1" ||
    normalized.startsWith("fc") || normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized);
}

export function isPrivateNetworkAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? privateIpv4(address) : family === 6 ? privateIpv6(address) : true;
}

export async function assertPublicDns(input: string) {
  const url = assertPublicHttpsUrl(input);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((result) => isPrivateNetworkAddress(result.address))) {
    throw new Error(`${url.hostname} resolves to a private or reserved network address`);
  }
  return url;
}

export async function publicFetch(input: string | URL | Request, init?: RequestInit) {
  const url = typeof input === "string" || input instanceof URL
    ? input.toString()
    : input.url;
  await assertPublicDns(url);
  return fetch(input, init);
}
