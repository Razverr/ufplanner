export const courses = [
  {
    id: "course-a",
    name: "Introduction to Programming",
    credits: 3,
    requirement: "Core",
    prerequisites: [],
  },
  {
    id: "course-b",
    name: "Advanced Programming",
    credits: 3,
    requirement: "Core",
    prerequisites: ["course-a"],
  },
  {
    id: "course-c",
    name: "Computing Elective",
    credits: 3,
    requirement: "Elective",
    prerequisites: [],
  },
];