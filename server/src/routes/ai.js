const router = require('express').Router();
const DoctorProfile = require('../models/DoctorProfile');
const { askClaude } = require('../utils/ai');

const SPECIALTIES = ['General Physician', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dentistry', 'Psychiatry'];
const EMERGENCY = /chest pain|can'?t breathe|cannot breathe|severe bleeding|unconscious|stroke|face droop|suicid|overdose|seizure/i;
const RULES = [
  [/chest|palpitation|heart|breathless|shortness of breath/i, 'Cardiology', ['Heart rhythm or blood-pressure related issue', 'Anxiety or panic', 'Lung or muscle strain']],
  [/rash|itch|acne|skin|eczema|hair fall|allerg/i, 'Dermatology', ['Allergic reaction or contact dermatitis', 'Eczema or fungal infection', 'Acne']],
  [/child|baby|infant|toddler|my son|my daughter/i, 'Pediatrics', ['Common childhood infection', 'Growth or nutrition concern', 'Viral fever']],
  [/bone|joint|knee|back pain|fracture|sprain|shoulder|neck pain/i, 'Orthopedics', ['Muscle or ligament strain', 'Arthritis or joint wear', 'Posture related pain']],
  [/headache|migraine|dizz|numb|tingling|memory|tremor/i, 'Neurology', ['Tension headache or migraine', 'Dehydration or low blood sugar', 'Nerve irritation']],
  [/tooth|gum|dental|jaw|cavity/i, 'Dentistry', ['Cavity or gum infection', 'Tooth sensitivity', 'Jaw joint strain']],
  [/anxiety|depress|stress|sleep|insomnia|panic|mood/i, 'Psychiatry', ['Stress or anxiety', 'Sleep disorder', 'Low mood']],
];

router.post('/symptoms', async (req, res, next) => {
  try {
    const { symptoms, age, gender } = req.body;
    if (!symptoms || symptoms.trim().length < 5) return res.status(400).json({ message: 'Describe your symptoms in a few words' });
    const text = symptoms.slice(0, 1200);

    let result = null;
    const raw = await askClaude(
      'You are a careful health triage assistant for a clinic app. You are not a doctor and never give a diagnosis. Reply with ONLY JSON.',
      `Patient: age ${age || 'unknown'}, ${gender || 'unspecified'}. Symptoms: "${text}".\nReturn JSON: {"urgency":"low|medium|high","specialty":one of ${JSON.stringify(SPECIALTIES)},"causes":[up to 3 short possible causes],"advice":"2-3 sentences of safe self-care and when to see a doctor"}`
    );
    if (raw) { try { result = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]); } catch { result = null; } }

    const ai = !!result;
    if (!result) {
      const hit = RULES.find(([re]) => re.test(text));
      result = {
        urgency: /fever|vomit|infection|pain|bleed/i.test(text) ? 'medium' : 'low',
        specialty: hit ? hit[1] : 'General Physician',
        causes: hit ? hit[2] : ['Common viral infection', 'Fatigue or dehydration', 'Seasonal allergy'],
        advice: 'Rest, drink plenty of fluids and monitor your symptoms. If they last more than two or three days or get worse, book a consultation.',
      };
    }
    if (EMERGENCY.test(text)) { result.urgency = 'high'; result.advice = 'These symptoms can be an emergency. Call your local emergency number (112 in India) or go to the nearest hospital now. ' + (result.advice || ''); }
    if (!SPECIALTIES.includes(result.specialty)) result.specialty = 'General Physician';

    let doctors = await DoctorProfile.find({ approved: true, specialty: result.specialty }).populate('user', 'name').sort({ rating: -1 }).limit(3);
    if (!doctors.length) doctors = await DoctorProfile.find({ approved: true }).populate('user', 'name').sort({ rating: -1 }).limit(3);
    res.json({ ...result, ai, doctors, disclaimer: 'This is general guidance, not a medical diagnosis.' });
  } catch (e) { next(e); }
});

module.exports = router;
