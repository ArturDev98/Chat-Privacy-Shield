// Reloj falso: new Date() y Date.now() devuelven la hora fijada con setFakeTime().
(function () {
  const RealDate = Date;
  let offset = 0;
  class FakeDate extends RealDate {
    constructor(...args) { if (args.length) super(...args); else super(RealDate.now() + offset); }
    static now() { return RealDate.now() + offset; }
  }
  window.setFakeTime = (y, mo, d, h, mi, s = 0) => { offset = new RealDate(y, mo, d, h, mi, s).getTime() - RealDate.now(); };
  window.Date = FakeDate;
})();
