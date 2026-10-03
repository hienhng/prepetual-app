# First rerun after preserving writer output

The run stopped at 2/3 automatically accepted questions after 245.048 seconds and 39 provider calls. It did not produce a complete quiz.

Manual review found that neither accepted checkpoint item should count as a valid learner-facing question:

- Both omitted the heat, work and duration per cycle for modes A and B. Those values appeared in the source and explanation, but were unavailable to the learner solving the stem.
- The short-answer explanation reversed an inequality. With time fixed at 200 seconds, substituting the time equation into the work constraint gives n_A >= 20/9, not 0 <= n_A <= 20/9. The proposed maximum of 2200 kJ happens to be correct, but its written derivation is not.
- Two of the three extracted source records were also dropped because their purported verbatim excerpts were altered or paraphrased.

The next change withholds source text and source images from the independent answer solve, while retaining source grounding checks in the final review. Further live results are stored separately in ../quiz-writer-three-closed-book.
