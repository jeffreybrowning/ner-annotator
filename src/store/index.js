import { LocalStorage } from "quasar";

const niceColors = [
  "red-7",
  "blue-7",
  "light-green-7",
  "deep-orange-7",
  "pink-7",
  "light-blue-7",
  "lime-7",
  "brown-3",
  "purple-3",
  "cyan-7",
  "yellow-7",
  "grey-3",
  "deep-purple-7",
  "teal-7",
  "amber-7",
  "blue-grey-5",
  "indigo-4",
  "green-7",
  "orange-7",
];

export const mutations = {
  setInputSentences(state, payload) {
    if (!Array.isArray(payload)) {
      state.originalText = payload;
      payload = payload.split(state.separator);
    }

    const data = JSON.parse(payload)

    state.inputSentences = data.map((s, i) => ({ id: i, text: s[0], tokens: s[0], spans: s[1]}))
  },
  addClass(state, payload) {
    let existing = state.classes.find((c) => c.name == payload);
    if (existing) {
      return;
    }
    let lastIndex = state.classes.reduce((p, c) => {
      return c.id > p ? c.id : p;
    }, 0);
    let newClass = {
      id: lastIndex + 1,
      name: payload,
      color: niceColors[lastIndex % niceColors.length],
    }
    state.classes = [...state.classes, newClass];
    if (state.classes.length === 1) {
      state.currentClass = state.classes[0];
    }
  },
  removeClass(state, payload) {
    state.classes = state.classes.filter((c) => c.id != payload);
    if (state.currentClass.id === payload) {
      state.currentClass = state.classes[0];
    }
  },
  setCurrentClass(state, payload) {
    state.currentClass = state.classes[payload];
  },
  addAnnotation(state, payload) {
    state.annotations[state.currentIndex] = payload;
    state.currentAnnotation = payload;
  },
  clearAllAnnotations(state) {
    state.annotations = [];
    state.currentAnnotation = {};
  },
  setSeparator(state, payload) {
    state.separator = payload;
    const sentences = state.originalText.split(state.separator);
    state.inputSentences = sentences.map((s, i) => ({ id: i, text: s }));
  },
  setAnnotationPrecision(state, payload) {
    state.annotationPrecision = payload;
  },
  setKeyboardShortcuts(state, payload) {
    state.enableKeyboardShortcuts = payload;
  },
  nextSentence(state) {
    if (state.currentIndex < state.inputSentences.length - 1) {
      state.currentIndex += 1;
      state.currentAnnotation = state.annotations[state.currentIndex] || {};
    } else {
      alert("You have completed all the sentences");
    }
  },
  previousSentence(state) {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      state.currentAnnotation = state.annotations[state.currentIndex];
    } else {
      alert("You are at the beginning of all sentences");
    }
  },
  resetIndex(state) {
    state.currentIndex = 0;
  },
  loadClasses(state, payload) {
    if (!Array.isArray(payload)) {
      throw new Error("loadClasses: payload must be an array");
    }
    let isValid = payload.reduce(
      (acc, curr) =>
        acc &&
        typeof curr === "object" &&
        "id" in curr &&
        "name" in curr &&
        "color" in curr,
      true
    );
    if (!isValid) {
      throw new Error("loadClasses: payload has invalid schema");
    }
    state.classes = payload;
    state.currentClass = state.classes[0];
    LocalStorage.set("tags", state.classes);
  },
  loadAnnotations(state, payload) {
    let isValid = typeof payload === "object" &&
    "annotations" in payload &&
    "classes" in payload;

    if (!isValid) {
      throw new Error("loadAnnotations: payload has invalid schema");
    }

    let annotations = payload.annotations;
    if (!Array.isArray(annotations)) {
      throw new Error("loadAnnotations: payload must be an array");
    }

    let newAnnotations = [];

    for (var i = 0; i < annotations.length; i++) {
      if (annotations[i] == null) continue;
      let annotation = {
        'text': annotations[i][0],
        'entities': annotations[i][1].entities,
      }
      newAnnotations[i] = annotation;
    }
    state.annotations = newAnnotations;
    state.currentAnnotation = state.annotations[state.currentIndex];
  },
};

export const getters = {};

const actions = {
  createNewClass({ commit, state }, className) {
    return new Promise((resolve, reject) => {
      commit("addClass", className);
      try {
        LocalStorage.set("tags", state.classes);
      } catch (e) {
        reject(e);
      }
      resolve();
    });
  },
  deleteClass({ commit, state }, classId) {
    commit("removeClass", classId);
    LocalStorage.set("tags", state.classes);
  },
};

window.addEventListener('beforeunload', async (event) => {
  event.returnValue = "Please make sure you export annotations before closing the file.";
});

export default {
  state() {
    let tags = LocalStorage.getItem("tags");
    return {
      annotations: [],
      classes: tags || [],
      inputSentences: [],
      originalText: "",
      separator: "\n",
      enableKeyboardShortcuts: true,
      annotationPrecision: "token",
      // current state
      currentAnnotation: {},
      currentClass: tags && tags[0] || {},
      currentIndex: 0,
      currentSentence: "",
    };
  },
  getters,
  mutations,
  actions,
};
