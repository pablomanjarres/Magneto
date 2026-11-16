import { describe, expect, it } from "vitest";
import type { Education, Experience, Profile } from "@moonlight/types";

import { applyEdits } from "../src/index.js";

const profile: Profile = {
  id: "p1",
  email: "laura@example.com",
  fullName: "Laura Restrepo",
  city: "Medellín",
  skills: [{ name: "React" }, { name: "SQL" }],
  experience: [],
  education: [],
  expectations: { targetRole: "Frontend Developer", workModes: ["remote"], cities: [] },
};

const nequi: Experience = {
  company: "Nequi",
  title: "Practicante de datos",
  startDate: "2026-11",
  source: "resume",
};
const globant: Experience = {
  company: "Globant",
  title: "Frontend Developer",
  startDate: "2022-03",
  endDate: "2024-01",
};
const bancolombia: Experience = {
  company: "Bancolombia",
  title: "Analista de datos",
  startDate: "2025-01",
  endDate: "2025-06",
};
const eafit: Education = {
  institution: "Universidad EAFIT",
  degree: "Ingeniería de Sistemas",
  startYear: 2016,
  endYear: 2021,
  source: "linkedin",
};
const sena: Education = {
  institution: "SENA",
  degree: "Tecnólogo en análisis de datos",
  startYear: 2014,
  endYear: 2015,
};

/** Entries to edit: an imported job and a typed one, an imported degree and a typed one. */
const filled: Profile = { ...profile, experience: [nequi, globant], education: [eafit, sena] };

describe("applyEdits", () => {
  it("sets the target area and says so", () => {
    const { profile: next, done } = applyEdits(profile, { targetArea: "Desarrollo de software" });
    expect(next.expectations.targetArea).toBe("Desarrollo de software");
    expect(done).toEqual(["Área: Desarrollo de software"]);
  });

  it("refuses an area or seniority outside the app's lists instead of claiming it", () => {
    const { profile: next, done } = applyEdits(profile, {
      targetArea: "Cocina",
      targetSeniority: "Gurú",
    });
    expect(next.expectations).toEqual(profile.expectations);
    expect(done).toEqual([]);
  });

  it("never adds a skill the profile has under another spelling", () => {
    const { profile: next, done } = applyEdits(profile, {
      addSkills: ["React.js", "Docker", "docker"],
      removeSkills: ["sql"],
    });
    expect(next.skills.map((s) => s.name)).toEqual(["React", "Docker"]);
    expect(done).toEqual(["Habilidades agregadas: Docker", "Habilidades quitadas: sql"]);
  });

  it("leaves every field it was not asked to change", () => {
    const { profile: next } = applyEdits(profile, { workModes: ["hybrid"] });
    expect(next).toEqual({
      ...profile,
      expectations: { ...profile.expectations, workModes: ["hybrid"] },
    });
  });

  it("sets the full name", () => {
    const { profile: next, done } = applyEdits(profile, { fullName: "Laura Restrepo Gómez" });
    expect(next.fullName).toBe("Laura Restrepo Gómez");
    expect(done).toEqual(["Nombre: Laura Restrepo Gómez"]);
  });

  it("sets a valid e-mail and refuses an invalid one without claiming it", () => {
    const valid = applyEdits(profile, { email: "laura.r@gmail.com" });
    expect(valid.profile.email).toBe("laura.r@gmail.com");
    expect(valid.done).toEqual(["Correo: laura.r@gmail.com"]);

    const invalid = applyEdits(profile, { email: "laura.gmail.com" });
    expect(invalid.profile.email).toBe("laura@example.com");
    expect(invalid.done).toEqual([]);
  });

  it("ignores an index that does not exist, without claiming it", () => {
    const { profile: next, done } = applyEdits(filled, {
      updateExperience: [{ index: 2, title: "CTO" }],
      removeExperience: [-1, 1.5, 5],
      updateEducation: [{ index: 9, degree: "MBA" }],
      removeEducation: [2],
    });
    expect(next).toEqual(filled);
    expect(done).toEqual([]);
  });

  it("names every change once", () => {
    const { profile: next, done } = applyEdits(filled, {
      fullName: "Laura Restrepo Gómez",
      updateExperience: [
        { index: 0, endDate: "2026-12" },
        { index: 0, title: "Practicante de ingeniería de datos" },
        { index: 1, title: "Removed anyway" },
      ],
      removeExperience: [1, 1],
      addExperience: [
        bancolombia,
        bancolombia,
        {
          company: "Nequi",
          title: "Practicante de ingeniería de datos",
          startDate: "2026-11",
          description: "Pipelines de datos",
        },
      ],
    });
    expect(next.experience).toEqual([
      {
        company: "Nequi",
        title: "Practicante de ingeniería de datos",
        startDate: "2026-11",
        endDate: "2026-12",
        description: "Pipelines de datos",
      },
      bancolombia,
    ]);
    expect(done).toEqual([
      "Nombre: Laura Restrepo Gómez",
      "Cargo actualizado: Practicante de ingeniería de datos en Nequi",
      "Cargo agregado: Analista de datos en Bancolombia",
      "Cargo quitado: Frontend Developer en Globant",
    ]);
  });
});

describe("applyEdits on jobs", () => {
  it("adds a dictated job as the candidate's own, even at a company already listed", () => {
    const later: Experience = { company: "Globant", title: "Tech Lead", startDate: "2025-02" };
    const tagged: Experience = { ...bancolombia, source: "linkedin" };
    const { profile: next, done } = applyEdits(filled, { addExperience: [tagged, later] });
    expect(next.experience).toEqual([nequi, globant, bancolombia, later]);
    expect(next.experience[2]?.source).toBeUndefined();
    expect(done).toEqual([
      "Cargo agregado: Analista de datos en Bancolombia",
      "Cargo agregado: Tech Lead en Globant",
    ]);
  });

  it("updates the job already there instead of adding a second one", () => {
    const { profile: next, done } = applyEdits(filled, {
      addExperience: [
        // Same company and overlapping dates.
        {
          company: "Nequi",
          title: "Practicante de ingeniería de datos",
          startDate: "2026-11",
          endDate: "2026-12",
        },
        // Same company and title, started months apart.
        { company: "Globant", title: "Frontend Developer", startDate: "2022-09" },
      ],
    });
    expect(next.experience).toEqual([
      {
        company: "Nequi",
        title: "Practicante de ingeniería de datos",
        startDate: "2026-11",
        endDate: "2026-12",
      },
      { ...globant, startDate: "2022-09" },
    ]);
    expect(next.experience[0]?.source).toBeUndefined();
    expect(done).toEqual([
      "Cargo actualizado: Practicante de ingeniería de datos en Nequi",
      "Cargo actualizado: Frontend Developer en Globant",
    ]);
  });

  it("edits a job by its index and keeps where it came from", () => {
    const { profile: next, done } = applyEdits(filled, {
      updateExperience: [
        { index: 0, endDate: "2026-12" },
        { index: 1, title: "Frontend Lead", endDate: null },
      ],
    });
    expect(next.experience).toEqual([
      { ...nequi, endDate: "2026-12" },
      { company: "Globant", title: "Frontend Lead", startDate: "2022-03" },
    ]);
    expect(next.experience[1]?.endDate).toBeUndefined();
    expect(done).toEqual([
      "Cargo actualizado: Practicante de datos en Nequi",
      "Cargo actualizado: Frontend Lead en Globant",
    ]);
  });

  it("removes a job by its index", () => {
    const { profile: next, done } = applyEdits(filled, { removeExperience: [0] });
    expect(next.experience).toEqual([globant]);
    expect(done).toEqual(["Cargo quitado: Practicante de datos en Nequi"]);
  });
});

describe("applyEdits on studies", () => {
  it("adds a dictated study as the candidate's own", () => {
    const course: Education = {
      institution: "Platzi",
      degree: "Curso de Python",
      startYear: 0,
      endYear: 2023,
    };
    const { profile: next, done } = applyEdits(filled, {
      addEducation: [{ ...course, source: "resume" }],
    });
    expect(next.education).toEqual([eafit, sena, course]);
    expect(next.education[2]?.source).toBeUndefined();
    expect(done).toEqual(["Estudio agregado: Curso de Python, Platzi"]);
  });

  it("updates the study already there instead of adding a second one", () => {
    const { profile: next, done } = applyEdits(filled, {
      addEducation: [
        {
          institution: "Universidad EAFIT",
          degree: "Ingeniería de Sistemas",
          startYear: 2016,
          endYear: 2022,
        },
      ],
    });
    expect(next.education).toEqual([
      {
        institution: "Universidad EAFIT",
        degree: "Ingeniería de Sistemas",
        startYear: 2016,
        endYear: 2022,
      },
      sena,
    ]);
    expect(next.education[0]?.source).toBeUndefined();
    expect(done).toEqual(["Estudio actualizado: Ingeniería de Sistemas, Universidad EAFIT"]);
  });

  it("edits a study by its index and keeps where it came from", () => {
    const { profile: next, done } = applyEdits(filled, {
      updateEducation: [
        { index: 1, degree: "Tecnólogo en análisis y desarrollo de software" },
        { index: 0, endYear: null },
      ],
    });
    expect(next.education).toEqual([
      {
        institution: "Universidad EAFIT",
        degree: "Ingeniería de Sistemas",
        startYear: 2016,
        source: "linkedin",
      },
      { ...sena, degree: "Tecnólogo en análisis y desarrollo de software" },
    ]);
    expect(next.education[0]?.endYear).toBeUndefined();
    expect(done).toEqual([
      "Estudio actualizado: Ingeniería de Sistemas, Universidad EAFIT",
      "Estudio actualizado: Tecnólogo en análisis y desarrollo de software, SENA",
    ]);
  });

  it("removes a study by its index", () => {
    const { profile: next, done } = applyEdits(filled, { removeEducation: [1] });
    expect(next.education).toEqual([eafit]);
    expect(done).toEqual(["Estudio quitado: Tecnólogo en análisis de datos, SENA"]);
  });
});
