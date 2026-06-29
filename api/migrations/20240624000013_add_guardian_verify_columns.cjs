module.exports = {
  up(pgm) {
    pgm.addColumns('guardian_links', {
      approved_at: { type: 'timestamp' },
    });
    pgm.addColumns('guardians', {
      verified_at: { type: 'timestamp' },
    });
  },
  down(pgm) {
    pgm.dropColumns('guardian_links', ['approved_at']);
    pgm.dropColumns('guardians', ['verified_at']);
  },
};
