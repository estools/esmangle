if (cond) { if (a) c; } else v;
if (cond) { if (a) throw c; } else v;
if (cond) { with (cond) if (a) throw c; } else v;
if (cond) { do if (a) throw c; while (cond) } else v;
