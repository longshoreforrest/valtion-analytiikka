/**
 * Koalitiosimulaattorin matematiikka — PCA, konsensus/hajonta ja tavoite-etäisyys.
 *
 * Tämä on puhdas TypeScript-toteutus ilman ulkoisia kirjastoja:
 *  - Power iteration -PCA top-3 komponentille (deflaatio)
 *  - Centroid + std per dimensio
 *  - Euklidinen etäisyys tavoitteesta
 *
 * Käytämme PCA:ta puolueiden 12-dimensioisen arvomallin tiivistämiseen
 * 2D/3D-projektioiksi, ja erikseen "missä kenkä puristaa" -mittariin
 * lasketaan dimensiokohtainen hajonta valitulle koalitiolle.
 */

import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
} from "./parties";

export type Vector = number[];

export interface PcaResult {
  /** Top-K komponentit (yksikkövektoreita), pituus VALUE_DIMENSIONS.length */
  components: Vector[];
  /** Komponentteja vastaavat ominaisarvot eli selitetty varianssi (laskeva) */
  variances: number[];
  /** Selitysasteet (variance / total) */
  explained: number[];
  /** Keskiarvovektori jonka avulla data oli keskitetty */
  mean: Vector;
}

/** Puolue projektoituna PCA-akseleille */
export interface ProjectedParty {
  partyId: string;
  /** Pisteen koordinaatit PCA-akseleilla, K kpl */
  coords: Vector;
}

/** Yhden dimension hajontatieto valitulle koalitiolle */
export interface DimensionFriction {
  dimensionId: string;
  nimi: string;
  /** Keskiarvo (0–10) */
  mean: number;
  /** Mediaani */
  median: number;
  /** Hajonta (populaatio-std) */
  std: number;
  /** Vaihteluväli (max - min) */
  range: number;
  /** Pisteet puolueittain järjestyksessä mukana */
  points: Array<{ partyId: string; arvo: number }>;
  /** Min ja max puolueet */
  min: { partyId: string; arvo: number };
  max: { partyId: string; arvo: number };
}

// ---------- Apurit ----------

function partyVector(pid: string): Vector {
  const profile = PARTY_VALUES[pid];
  return VALUE_DIMENSIONS.map((d) => profile?.[d.id]?.arvo ?? 5);
}

function vectorDot(a: Vector, b: Vector): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function vectorNorm(v: Vector): number {
  return Math.sqrt(vectorDot(v, v));
}

function vectorNormalize(v: Vector): Vector {
  const n = vectorNorm(v);
  if (n === 0) return v.slice();
  return v.map((x) => x / n);
}

function meanCenter(matrix: Vector[]): {
  centered: Vector[];
  mean: Vector;
} {
  const n = matrix.length;
  const d = matrix[0].length;
  const mean = new Array(d).fill(0);
  for (const row of matrix) {
    for (let i = 0; i < d; i++) mean[i] += row[i];
  }
  for (let i = 0; i < d; i++) mean[i] /= n;
  const centered = matrix.map((row) => row.map((v, i) => v - mean[i]));
  return { centered, mean };
}

function covariance(centered: Vector[]): number[][] {
  const n = centered.length;
  const d = centered[0].length;
  const C: number[][] = Array.from({ length: d }, () =>
    new Array(d).fill(0)
  );
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += centered[k][i] * centered[k][j];
      // Käytetään populaatio-jakajaa n; pieni n (8–9) → otosjakaja n-1 olisi
      // herkempi, mutta tässä tarkoitus on visualisoiva — kumpi tahansa toimii.
      C[i][j] = s / Math.max(1, n - 1);
      C[j][i] = C[i][j];
    }
  }
  return C;
}

function multiplyMatrixVector(M: number[][], v: Vector): Vector {
  const d = M.length;
  const out = new Array(d).fill(0);
  for (let i = 0; i < d; i++) {
    let s = 0;
    for (let j = 0; j < d; j++) s += M[i][j] * v[j];
    out[i] = s;
  }
  return out;
}

/**
 * Power iteration: löytää suurinta ominaisarvoa vastaavan ominaisvektorin.
 *
 * Symmetriselle positiivisemidefiniittiselle matriisille (kovarianssimatriisi)
 * tämä konvergoi luotettavasti.
 */
function powerIteration(
  M: number[][],
  iters = 200,
  seed = 1
): { eigenvector: Vector; eigenvalue: number } {
  const d = M.length;
  // Deterministinen siemen jotta tulokset toistuvat (ei satunnainen)
  let v: Vector = Array.from({ length: d }, (_, i) =>
    Math.sin(i * 12.9898 + seed * 78.233) * 1.7
  );
  v = vectorNormalize(v);
  for (let it = 0; it < iters; it++) {
    const Mv = multiplyMatrixVector(M, v);
    const norm = vectorNorm(Mv);
    if (norm < 1e-12) break;
    v = Mv.map((x) => x / norm);
  }
  const Mv = multiplyMatrixVector(M, v);
  const eigenvalue = vectorDot(Mv, v);
  return { eigenvector: v, eigenvalue };
}

function deflate(M: number[][], v: Vector, lambda: number): number[][] {
  const d = M.length;
  const out: number[][] = Array.from({ length: d }, () =>
    new Array(d).fill(0)
  );
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      out[i][j] = M[i][j] - lambda * v[i] * v[j];
    }
  }
  return out;
}

// ---------- PCA ----------

/**
 * Lasketaan PCA puoluejoukolle. K = komponenttien lukumäärä (oletus 3).
 */
export function pcaForParties(partyIds: string[], k = 3): PcaResult {
  const data = partyIds.map((pid) => partyVector(pid));
  const { centered, mean } = meanCenter(data);
  let C = covariance(centered);
  const components: Vector[] = [];
  const variances: number[] = [];
  for (let i = 0; i < k; i++) {
    const { eigenvector, eigenvalue } = powerIteration(C, 200, i + 1);
    components.push(eigenvector);
    variances.push(Math.max(0, eigenvalue));
    C = deflate(C, eigenvector, eigenvalue);
  }
  // Selitysaste: kokonaisvarianssi koko datasta = trace(cov), jota
  // käytämme jakajana — antaa "osuus selitettyä koko varianssista" -tulkinnan.
  const totalVarFull = covariance(meanCenter(data).centered)
    .reduce((s, row, i) => s + row[i], 0);
  const explained = variances.map((v) =>
    totalVarFull > 0 ? v / totalVarFull : 0
  );
  return { components, variances, mean, explained: explained };
}

/**
 * Projektoi puolueet PCA-avaruuteen. Jokainen koordinaatti on:
 *   coord_k = (vector - mean) · component_k
 */
export function projectParties(
  pca: PcaResult,
  partyIds: string[]
): ProjectedParty[] {
  return partyIds.map((pid) => {
    const v = partyVector(pid);
    const centered = v.map((x, i) => x - pca.mean[i]);
    const coords = pca.components.map((c) => vectorDot(centered, c));
    return { partyId: pid, coords };
  });
}

// ---------- Konsensus / ristiveto ----------

/**
 * Lasketaan dimensiokohtainen hajonta valitulle koalitiolle. Tulos on
 * järjestetty hajonnan (std) mukaan laskevaan järjestykseen — eli
 * "missä kenkä puristaa eniten" tulee ensin.
 */
export function dimensionFrictions(partyIds: string[]): DimensionFriction[] {
  if (partyIds.length === 0) return [];
  const result: DimensionFriction[] = VALUE_DIMENSIONS.map((d) => {
    const points = partyIds.map((pid) => ({
      partyId: pid,
      arvo: PARTY_VALUES[pid]?.[d.id]?.arvo ?? 5,
    }));
    const arvot = points.map((p) => p.arvo);
    const mean = arvot.reduce((s, v) => s + v, 0) / arvot.length;
    const sortedArvot = [...arvot].sort((a, b) => a - b);
    const median =
      sortedArvot.length % 2 === 1
        ? sortedArvot[(sortedArvot.length - 1) / 2]
        : (sortedArvot[sortedArvot.length / 2 - 1] +
            sortedArvot[sortedArvot.length / 2]) /
          2;
    const variance =
      arvot.reduce((s, v) => s + (v - mean) * (v - mean), 0) / arvot.length;
    const std = Math.sqrt(variance);
    const min = points.reduce((a, b) => (a.arvo <= b.arvo ? a : b));
    const max = points.reduce((a, b) => (a.arvo >= b.arvo ? a : b));
    return {
      dimensionId: d.id,
      nimi: d.nimi,
      mean,
      median,
      std,
      range: max.arvo - min.arvo,
      points,
      min,
      max,
    };
  });
  return result.sort((a, b) => b.std - a.std);
}

// ---------- Hallitusohjelma-tavoite ----------

export interface GoalEvaluation {
  /** Kokonaisetäisyys koalitiosta tavoitteeseen (rms-tyyli per puolue) */
  perParty: Array<{ partyId: string; distance: number }>;
  /** Per dimensio: tavoite vs. koalition keskiarvo, sekä yksittäisten puolueiden poikkeamat */
  perDimension: Array<{
    dimensionId: string;
    nimi: string;
    target: number;
    coalitionMean: number;
    deltaFromTarget: number;
    /** Per puolue poikkeama tavoitteesta */
    deviations: Array<{ partyId: string; arvo: number; delta: number }>;
  }>;
  /** Koalition keskiarvo per dimensio */
  coalitionMean: Vector;
}

/**
 * Vertaa annettua tavoiteohjelmaa puoluejoukkoon. Jokaiselle puolueelle
 * lasketaan euklidinen etäisyys tavoitteesta (∑(target_i - puolue_i)^2).
 *
 * @param targets Mappi dimensionId → tavoitearvo (0–10)
 */
export function evaluateGoals(
  partyIds: string[],
  targets: Record<string, number>
): GoalEvaluation {
  const dims = VALUE_DIMENSIONS;
  const targetVec = dims.map((d) => targets[d.id] ?? 5);
  const partyVectors = partyIds.map((pid) => partyVector(pid));
  const perParty = partyIds.map((pid, idx) => {
    const v = partyVectors[idx];
    const sq = v.reduce(
      (s, x, i) => s + (x - targetVec[i]) * (x - targetVec[i]),
      0
    );
    return { partyId: pid, distance: Math.sqrt(sq / dims.length) };
  });

  const coalitionMean = dims.map((_, i) => {
    if (partyVectors.length === 0) return 5;
    return (
      partyVectors.reduce((s, v) => s + v[i], 0) / partyVectors.length
    );
  });

  const perDimension = dims.map((d, i) => {
    const t = targetVec[i];
    return {
      dimensionId: d.id,
      nimi: d.nimi,
      target: t,
      coalitionMean: coalitionMean[i],
      deltaFromTarget: coalitionMean[i] - t,
      deviations: partyIds.map((pid, idx) => ({
        partyId: pid,
        arvo: partyVectors[idx][i],
        delta: partyVectors[idx][i] - t,
      })),
    };
  });

  return { perParty, perDimension, coalitionMean };
}

/**
 * Tulkitsee komponentin "loadings" -arvot (=ominaisvektorin komponentit).
 * Suurimmat positiiviset ja negatiiviset komponentit kuvaavat kumman
 * suunnan dimensiot dominoivat kyseistä PCA-akselia.
 */
export function componentTopLoadings(
  component: Vector,
  count = 3
): {
  positive: Array<{ dimensionId: string; nimi: string; loading: number }>;
  negative: Array<{ dimensionId: string; nimi: string; loading: number }>;
} {
  const annotated = component.map((v, i) => ({
    dimensionId: VALUE_DIMENSIONS[i].id,
    nimi: VALUE_DIMENSIONS[i].nimi,
    loading: v,
  }));
  const sortedDesc = [...annotated].sort((a, b) => b.loading - a.loading);
  const sortedAsc = [...annotated].sort((a, b) => a.loading - b.loading);
  return {
    positive: sortedDesc.slice(0, count),
    negative: sortedAsc.slice(0, count),
  };
}

/** Apuriksi: hae puolue id:llä */
export function partyById(id: string) {
  return PARTIES.find((p) => p.id === id);
}
