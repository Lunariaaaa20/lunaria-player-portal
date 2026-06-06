export const rankTheme = {
      Initiate: {
          label: "Initiate",
              icon: "/assets/ranks/initiate.png",
                  className: "rank-initiate",
                    },
                      Seeker: {
                          label: "Seeker",
                              icon: "/assets/ranks/seeker.png",
                                  className: "rank-seeker",
                                    },
                                      Warden: {
                                          label: "Warden",
                                              icon: "/assets/ranks/warden.png",
                                                  className: "rank-warden",
                                                    },
                                                      Arbiter: {
                                                          label: "Arbiter",
                                                              icon: "/assets/ranks/arbiter.png",
                                                                  className: "rank-arbiter",
                                                                    },
                                                                      "High Council": {
                                                                          label: "High Council",
                                                                              icon: "/assets/ranks/high-council.png",
                                                                                  className: "rank-high-council",
                                                                                    },
                                                                                    };

                                                                                    export const pathwayTheme = {
                                                                                      Warrior: {
                                                                                          label: "Warrior",
                                                                                              icon: "/assets/pathways/warrior.png",
                                                                                                  className: "pathway-warrior",
                                                                                                    },
                                                                                                      Mystic: {
                                                                                                          label: "Mystic",
                                                                                                              icon: "/assets/pathways/mystic.png",
                                                                                                                  className: "pathway-mystic",
                                                                                                                    },
                                                                                                                      Shadow: {
                                                                                                                          label: "Shadow",
                                                                                                                              icon: "/assets/pathways/shadow.png",
                                                                                                                                  className: "pathway-shadow",
                                                                                                                                    },
                                                                                                                                      Nature: {
                                                                                                                                          label: "Nature",
                                                                                                                                              icon: "/assets/pathways/nature.png",
                                                                                                                                                  className: "pathway-nature",
                                                                                                                                                    },
                                                                                                                                                    };

                                                                                                                                                    export function getRankTheme(rank) {
                                                                                                                                                      return rankTheme[rank] || rankTheme.Initiate;
                                                                                                                                                      }

                                                                                                                                                      export function getPathwayTheme(pathway) {
                                                                                                                                                        return pathwayTheme[pathway] || {
                                                                                                                                                            label: pathway || "Unknown",
                                                                                                                                                                icon: null,
                                                                                                                                                                    className: "pathway-unknown",
                                                                                                                                                                      };
                                                                                                                                                                      
}