const { Collection } = require("discord.js");

module.exports = {
    GCA: {
        id: "1000101905",
        tag: "G-C-A",
        name: "Gemini's Comerades in Arms",
        discord_id: "1126377465741324429",
    },

    Ranks: {
        "commander": "Commander",
        "executive_officer": "Deputy Commander",
        "recruitment_officer": "Recruiter",
        "commissioned_officer": "Commissioned Officer",
        "officer": "Line Officer",
        "private": "Midshipman",
        "null": "Civilian",

        Shorts: {
            "commander": "(CO)",
            "executive_officer": "(XO)",
            "recruitment_officer": "(R)",
            "commissioned_officer": "(C)",
            "officer": "(L)",
            "private": "(M)",
        },

        Values: {
            "commander": 5,
            "executive_officer": 4,
            "recruitment_officer": 3,
            "commissioned_officer": 2,
            "officer": 1,
            "private": 0,
            "null": -1,
        },
    },

    _Ranks: [
        { discord_id: '1126377465741324435', rank: 0, short: '(M)', key: 'private', name: 'Midshipman' },
        { discord_id: '1126377465741324435', rank: 1, short: '(L)', key: 'officer', name: 'Line Officer' },
        { discord_id: '1126377465741324435', rank: 2, short: '(C)', key: 'commissioned_officer', name: 'Commissioned Officer' },
        { discord_id: '1126377465741324436', rank: 3, short: '(R)', key: 'recruitment_officer', name: 'Recruiter' },
        { discord_id: '1126377465741324437', rank: 4, short: '(XO)', key: 'executive_officer', name: 'Deputy Commander' },
        { discord_id: '1126377465741324438', rank: 5, short: '(CO)', key: 'commander', name: 'Commander' },
    ]
};
