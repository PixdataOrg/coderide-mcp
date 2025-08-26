# 🛡️ CodeRide Security Researcher Program

## Our Commitment to Security

CodeRide is built by developers, for developers. We believe security is a community effort and welcome responsible security research that helps protect our users.

## 🎯 Scope & Eligible Targets

### ✅ In Scope:

- **CodeRide MCP Server**: github.com/PixdataOrg/coderide-mcp
- **CodeRide API**: api.coderide.ai
- **CodeRide Web App**: app.coderide.ai
- **CodeRide Website**: coderide.ai
- Docker containers and deployment configurations
- Authentication and authorization systems
- Data handling and privacy protections

#### MCP-Specific Security Areas:
- Tool injection attacks (malicious tool definitions)
- MCP protocol manipulation (message tampering, protocol violations)
- Unauthorized tool execution (bypassing access controls)
- Context poisoning attacks (injecting malicious context data)
- Resource exhaustion through tool abuse
- Cross-tool data leakage between MCP sessions
- Input validation bypasses in tool parameters
- MCP transport security (stdio, HTTP, WebSocket)

### ❌ Out of Scope:

- Social engineering attacks against our team
- Physical attacks against our infrastructure
- Third-party services we integrate with (unless we've modified them)
- Denial of Service (DoS/DDoS) attacks
- Spam or content issues

#### Additional Exclusions:
- Vulnerabilities in unmodified third-party dependencies
- Issues requiring physical access to user devices
- Vulnerabilities requiring extensive user interaction beyond normal usage
- Theoretical attacks without practical exploitation paths
- Issues in client-side MCP implementations we don't control
- Vulnerabilities that require admin/root access to the host system
- Issues that only affect unsupported or end-of-life software versions
- Rate limiting bypasses that don't lead to resource exhaustion
- Missing security headers that don't lead to exploitable vulnerabilities

## 🏆 Reward Structure

### Critical Severity 🔴
*Container escapes, RCE, authentication bypasses, data breaches*

- Early Adopter lifetime access (€119 value)
- Public recognition in humans.txt, GitHub, and blog post
- Direct line to our security team
- Special "Security Hero" status in our community

### High Severity 🟠
*Privilege escalation, injection flaws, sensitive data exposure*

- 3 months Pro plan (€87 value)
- Public recognition in humans.txt and GitHub
- Security team contact

### Medium Severity 🟡
*Authorization flaws, information disclosure, business logic errors*

- 3 months Creator plan (€27 value)
- Public recognition with permission
- Community thanks

### Low Severity 🟢
*Configuration issues, minor information leaks, UI security issues*

- 1 month Creator plan (€9 value)
- Public recognition with permission
- Our genuine gratitude

### Informational ℹ️
*Security best practices, suggestions, documentation improvements*

- Public recognition with permission
- Community contributor status
- Direct feedback channel

## 📋 Responsible Disclosure Guidelines

### ✅ Good Faith Research:

- Make every effort to avoid privacy violations and data destruction
- Only interact with accounts you own or with explicit permission
- Don't spam, social engineer, or physically attack our team
- Report vulnerabilities promptly after discovery
- Give us reasonable time to respond (we aim for 48-72 hours)

### ✅ Quality Reports Should Include:

- Clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Proof of concept (if applicable)
- Suggested remediation (if you have ideas)

### ✅ Communication:

- **Email**: hello+security@coderide.ai
- **Subject**: [SECURITY] Brief description
- Use PGP if handling sensitive details: [PGP key if you have one]

## ⚡ Our Response Promise

- **Initial response**: Within 72 hours
- **Severity assessment**: Within 1 week
- **Resolution timeline**: Based on complexity
- **Public disclosure**: After fix is deployed (coordinated with you)
- **Reward delivery**: Within 48 hours of issue resolution

## 🤝 Community Values

We're a small but growing team building something meaningful for developers. We especially value:

- **Educational spirit** - Help us learn and grow
- **Community focus** - Make CodeRide safer for everyone
- **Professional approach** - Clear communication and responsible disclosure
- **Long-term thinking** - Building relationships, not just finding bugs

## 🚀 Special Recognition

Outstanding security researchers may be invited to:

- Beta test new security features
- Advisory discussions on security architecture
- Community ambassador opportunities
- Conference/blog mentions (with permission)

## 📜 Legal Safe Harbor

We support security research conducted in good faith. We will not pursue legal action against researchers who:

- Follow these guidelines
- Act in good faith
- Don't violate laws or harm users
- Coordinate disclosure with our team

---

**Questions?** Email us at hello+security@coderide.ai  
**Last Updated**: August 25, 2025  
**Program Status**: Active

*"Security is not a feature, it's a foundation. Thank you for helping us build on solid ground."* - The CodeRide Team

## 🛡️ Security Hall of Fame

...

Want to join our Security Hall of Fame? We're always looking for responsible security researchers to help make CodeRide safer for developers worldwide.
