const Footer = () => (
  <footer className="mt-8 border-t border-border px-5 pb-20 pt-6 text-[12px] text-muted-foreground">
    <div className="mx-auto max-w-md space-y-3 text-left sm:text-center">
      <div>
        <p className="text-sm font-semibold text-foreground">Vos Resto</p>
        <p className="text-[11px]">La marketplace des restaurants au Sénégal</p>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-foreground">Contact</p>
        <p>
          <a href="mailto:vosresto@gmail.com" className="hover:text-foreground">
            📧 vosresto@gmail.com
          </a>
        </p>
        <p className="flex flex-wrap gap-x-2 sm:justify-center">
          <a href="tel:+221782264867" className="hover:text-foreground">
            📞 78 226 48 67
          </a>
          <span>—</span>
          <a href="tel:+221786342608" className="hover:text-foreground">
            78 634 26 08
          </a>
        </p>
      </div>
      <p className="pt-2 text-[11px]">© 2026 Vos Resto. Tous droits réservés.</p>
    </div>
  </footer>
);

export default Footer;
