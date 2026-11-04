// Source of fixtures/crackme/crackme, the binary for Ghidra MCP tests. Not copied into test runs.
// Build: cc -O1 -o scripts/agent-test/fixtures/crackme/crackme scripts/agent-test/sources/crackme.c && strip scripts/agent-test/fixtures/crackme/crackme
#include <stdio.h>
#include <string.h>

static const unsigned char key[] = {0x2e, 0x32, 0x3c, 0x3c, 0x2e, 0x30, 0x33, 0x31, 0x7f, 0x67, 0x61};
static const unsigned char mask = 0x5a;

static int check(const char *s) {
  size_t n = strlen(s);
  if (n != sizeof key) return 0;
  for (size_t i = 0; i < n; i++)
    if ((unsigned char)(s[i] ^ mask ^ (unsigned char)i) != key[i]) return 0;
  return 1;
}

int main(int argc, char **argv) {
  if (argc != 2) { fprintf(stderr, "usage: %s <password>\n", argv[0]); return 2; }
  if (check(argv[1])) { puts("Access granted"); return 0; }
  puts("Access denied");
  return 1;
}
