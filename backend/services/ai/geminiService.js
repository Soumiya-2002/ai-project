const axios = require('axios');

const generateAnalysis = async (textInput) => {
    // Placeholder for Gemini API call
    console.log("Calling Gemini API with Input Length:", textInput.length);

    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing. Returning mock COB Report.");
        return {
            "cob_analysis": {
                "Open Sesame (Concept)": "Covered correctly based on the transcript.",
                "Readers' Treasure": "Visual aids inferred from audio context.",
                "Eye to Mind": "Engagement seems positive."
            },
            "errors_identified": [
                "Simulated Error: Introduction was brief.",
                "Simulated Error: Did not ask open-ended questions."
            ],
            "structural_compliance": "Mostly compliant with SOP."
        };
    }

    try {
        // For now, we simulate the "Real" analysis with high-quality mock data
        // until the actual axios call to Google AI Studio is fully configured with their specific prompt.

        return {
            "cob_report": {
                "header": {
                    "facilitator": "Jane Doe",
                    "school": "Greenwood High",
                    "grade": "2",
                    "section": "A",
                    "subject": "EVS",
                    "topic_blm": "Wild Animals",
                    "observation_date": "Dec 12, 2023",
                    "duration": "00:45",
                    "session_type": "Concept Discussion",
                    "interaction_no": "04"
                },
                "scores": {
                    "overall_percentage": "82.5%",
                    "segments": {
                        "Concepts": "90%",
                        "Delivery": "85%",
                        "Language": "80%",
                        "Facilitator-Student": "75%"
                    }
                },
                "parameters": [
                    {
                        "category": "Concepts (50%)",
                        "name": "1. Concepts",
                        "description": "Makes no conceptual errors",
                        "score": 2,
                        "out_of": 2,
                        "weight": "40.0%",
                        "comment": "The facilitator made no conceptual errors. She delivered the concepts 'Wild vs Domestic' and 'Habitats' accurately and clearly."
                    },
                    {
                        "category": "Concepts (50%)",
                        "name": "2. Subject Language",
                        "description": "Uses correct subject language",
                        "score": 1,
                        "out_of": 2,
                        "weight": "2.5%",
                        "comment": "The facilitator made a subject language error when she said 'Lion lives in a den' (TCR 12:30). [Lions live in correct term...]"
                    },
                    {
                        "category": "Concepts (50%)",
                        "name": "3. Quality of Explanation",
                        "description": "Gives clear, lucid, logical explanations",
                        "score": 2,
                        "out_of": 2,
                        "weight": "40.0%",
                        "comment": "All explanations were clear and age-appropriate."
                    },
                    {
                        "category": "Delivery (20%)",
                        "name": "5. Preparation - Content",
                        "description": "Is completely prepared to teach",
                        "score": 1,
                        "out_of": 1,
                        "weight": "7.5%",
                        "comment": "The facilitator was well prepared."
                    },
                    {
                        "category": "Language (15%)",
                        "name": "14. Speaking Skills",
                        "description": "Clear voice, correct pronunciation",
                        "score": 2,
                        "out_of": 2,
                        "weight": "80.0%",
                        "comment": "Voice was clear and audible. No grammatical errors observed."
                    },
                    {
                        "category": "Facilitator-Student (15%)",
                        "name": "17. Student Engagement",
                        "description": "Ensures maximum students are engaged",
                        "score": 0,
                        "out_of": 1,
                        "weight": "0.0%",
                        "comment": "Many students were unengaged at the back benches (TCR 15:00, 18:20)."
                    }
                ],
                "highlights": [
                    "Excellent use of flashcards for visual learning.",
                    "Needs improvement in engaging back-benchers."
                ],
                "other_observations": [
                    "The facilitator checked for understanding using the '3-2-1' method.",
                    "Lighting was slightly dim during the board activity."
                ]
            }
        };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};

module.exports = { generateAnalysis };
