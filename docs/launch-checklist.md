# World Events Network launch checklist

- [ ] domain configured
- [ ] canonical host supplied through deployment configuration (no invented host)
- [ ] DNS configured
- [ ] production environment variables configured
- [ ] contact email and form destination configured server-side
- [ ] analytics ID configured only if approved
- [ ] Search Console verified
- [ ] robots.txt reviewed
- [ ] sitemap.xml generated with the final host
- [ ] favicon and application name reviewed
- [ ] final Open Graph image supplied
- [ ] WEN images supplied
- [ ] WEN video supplied
- [ ] social links verified
- [ ] content verification approved
- [ ] schema validation completed
- [ ] Lighthouse review completed
- [ ] mobile QA completed at 360px, 390px, and 430px
- [ ] form validation, success, failure, and duplicate-submit QA completed
- [ ] custom 404 verified with a 404 response
- [ ] redirects reviewed
- [ ] production build completed

Current static deployment limitation: the repository has no build-time site URL or form provider configuration. Add those before launch; relative canonical metadata is used until the final host is known.
