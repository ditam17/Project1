class PlagiarismDetector {
  normalize(code) {
    return code
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(
        /int|char|float|double|void|return|if|else|for|while|include|stdio|iostream|using|namespace|std|main|printf|scanf|cout|cin|endl/g,
        " $& ",
      )
      .trim();
  }

  getKGrams(text, k = 5) {
    const grams = [];
    for (let i = 0; i <= text.length - k; i++) {
      grams.push(text.substring(i, i + k));
    }
    return grams;
  }

  hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  winnow(grams, windowSize = 4) {
    const hashes = grams.map((g) => this.hash(g));
    const fingerprints = [];

    for (let i = 0; i <= hashes.length - windowSize; i++) {
      const window = hashes.slice(i, i + windowSize);
      const minHash = Math.min(...window);

      if (i === 0 || fingerprints[fingerprints.length - 1] !== minHash) {
        fingerprints.push(minHash);
      }
    }
    return fingerprints;
  }

  calculateSimilarity(code1, code2) {
    const norm1 = this.normalize(code1);
    const norm2 = this.normalize(code2);

    if (norm1.length < 5 || norm2.length < 5) return 0;

    const grams1 = this.getKGrams(norm1);
    const grams2 = this.getKGrams(norm2);

    const fp1 = new Set(this.winnow(grams1));
    const fp2 = new Set(this.winnow(grams2));

    const intersection = [...fp1].filter((x) => fp2.has(x)).length;
    const union = new Set([...fp1, ...fp2]).size;

    return union === 0 ? 0 : (intersection / union) * 100;
  }

  async findPlagiarismMatches(studentId, questionId, pool) {
    const currentSubmission = await pool.query(
      "SELECT code FROM submissions WHERE student_id = $1 AND question_id = $2",
      [studentId, questionId],
    );

    if (currentSubmission.rows.length === 0) return [];

    const currentCode = currentSubmission.rows[0].code;

    const allSubmissions = await pool.query(
      `SELECT s.student_id, u.name, s.code 
             FROM submissions s 
             JOIN users u ON s.student_id = u.id 
             WHERE s.question_id = $1 AND s.student_id != $2 AND s.status = 'submitted'`,
      [questionId, studentId],
    );

    const matches = [];
    for (const sub of allSubmissions.rows) {
      const similarity = this.calculateSimilarity(currentCode, sub.code);
      if (similarity > 85) {
        matches.push({
          student_id: sub.student_id,
          name: sub.name,
          similarity: similarity.toFixed(2),
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }
}

module.exports = new PlagiarismDetector();
