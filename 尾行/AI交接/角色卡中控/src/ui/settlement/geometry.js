"use strict";
const V_3D = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
};

const Q_3D = {
  id: () => [0, 0, 0, 1],
  norm: (q) => {
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
  },
  fromAxis: (ax, ang) => {
    const s = Math.sin(ang / 2);
    return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(ang / 2)];
  },
  mul: (a, b) => [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ],
  rotateVec: (q, v) => {
    const qv = [q[0], q[1], q[2]],
      qw = q[3];
    const t = V_3D.mul(V_3D.cross(qv, v), 2);
    return V_3D.add(V_3D.add(v, V_3D.mul(t, qw)), V_3D.cross(qv, t));
  },
  fromToVec: (vFrom, vTo) => {
    const from = V_3D.norm(vFrom),
      to = V_3D.norm(vTo);
    const d = V_3D.dot(from, to);
    if (d >= 0.999999) return [0, 0, 0, 1];
    if (d <= -0.999999) {
      let axis = V_3D.cross([1, 0, 0], from);
      if (V_3D.len(axis) < 0.001) axis = V_3D.cross([0, 1, 0], from);
      axis = V_3D.norm(axis);
      return [axis[0], axis[1], axis[2], 0];
    }
    const c = V_3D.cross(from, to);
    const s = Math.sqrt((1 + d) * 2);
    return [c[0] / s, c[1] / s, c[2] / s, s / 2];
  },
  slerp: (a, b, t) => {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    let bb = b;
    if (d < 0) {
      bb = [-b[0], -b[1], -b[2], -b[3]];
      d = -d;
    }
    if (d > 0.9995) {
      return Q_3D.norm([
        a[0] + (bb[0] - a[0]) * t,
        a[1] + (bb[1] - a[1]) * t,
        a[2] + (bb[2] - a[2]) * t,
        a[3] + (bb[3] - a[3]) * t,
      ]);
    }
    const th = Math.acos(Math.min(1, Math.max(-1, d)));
    const s = Math.sin(th);
    const wa = Math.sin((1 - t) * th) / s,
      wb = Math.sin(t * th) / s;
    return [
      a[0] * wa + bb[0] * wb,
      a[1] * wa + bb[1] * wb,
      a[2] * wa + bb[2] * wb,
      a[3] * wa + bb[3] * wb,
    ];
  },
};

function buildIcosahedron() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVerts = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1],
  ];
  const verts = rawVerts.map(V_3D.norm);
  const EDGE = 2 / Math.hypot(1, phi);

  const faces = [];
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      for (let k = j + 1; k < 12; k++) {
        const d_ij = Math.abs(V_3D.len(V_3D.sub(verts[i], verts[j])) - EDGE);
        const d_jk = Math.abs(V_3D.len(V_3D.sub(verts[j], verts[k])) - EDGE);
        const d_ki = Math.abs(V_3D.len(V_3D.sub(verts[k], verts[i])) - EDGE);
        if (d_ij < 1e-4 && d_jk < 1e-4 && d_ki < 1e-4) {
          const c = V_3D.mul(
            V_3D.add(V_3D.add(verts[i], verts[j]), verts[k]),
            1 / 3,
          );
          let n = V_3D.cross(
            V_3D.sub(verts[j], verts[i]),
            V_3D.sub(verts[k], verts[i]),
          );
          if (V_3D.dot(n, c) < 0) faces.push([i, k, j]);
          else faces.push([i, j, k]);
        }
      }
    }
  }

  const faceObjs = faces.map((indices, idx) => {
    const v0 = verts[indices[0]],
      v1 = verts[indices[1]],
      v2 = verts[indices[2]];
    const center = V_3D.norm(V_3D.mul(V_3D.add(V_3D.add(v0, v1), v2), 1 / 3));
    const u = V_3D.norm(V_3D.sub(v0, V_3D.mul(center, V_3D.dot(v0, center))));
    const w = V_3D.cross(center, u);
    return { idx, indices, center, n: center, u, w, value: 0 };
  });

  const paired = [];
  const used = new Set();
  for (let i = 0; i < faceObjs.length; i++) {
    if (used.has(i)) continue;
    let oppIdx = -1,
      minDot = 1;
    for (let j = i + 1; j < faceObjs.length; j++) {
      if (used.has(j)) continue;
      const dot = V_3D.dot(faceObjs[i].center, faceObjs[j].center);
      if (dot < minDot) {
        minDot = dot;
        oppIdx = j;
      }
    }
    if (oppIdx !== -1) {
      paired.push([i, oppIdx]);
      used.add(i);
      used.add(oppIdx);
    }
  }

  const VAL_PAIRS = [
    [20, 1],
    [14, 7],
    [18, 3],
    [12, 9],
    [16, 5],
    [19, 2],
    [13, 8],
    [17, 4],
    [11, 10],
    [15, 6],
  ];
  paired.forEach((p, idx) => {
    const [vA, vB] = VAL_PAIRS[idx % VAL_PAIRS.length];
    faceObjs[p[0]].value = vA;
    faceObjs[p[1]].value = vB;
  });

  return { verts, faces: faceObjs };
}

const SETTLE_GEO = buildIcosahedron();

function getFaceTargetQuat(face) {
  const q1 = Q_3D.fromToVec(face.n, [0, 0, 1]);
  const uRot = Q_3D.rotateVec(q1, face.u);
  const currentAngle = Math.atan2(uRot[0], -uRot[1]);
  const q2 = Q_3D.fromAxis([0, 0, 1], -currentAngle);
  return Q_3D.mul(q2, q1);
}

module.exports = {
  V_3D,
  Q_3D,
  buildIcosahedron,
  SETTLE_GEO,
  getFaceTargetQuat,
};
