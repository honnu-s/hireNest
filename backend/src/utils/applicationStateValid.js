
 const APPLICATION_FLOW = {
  APPLIED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

 function validateApplicationTransition(
  current,
  next
) {
  const allowedNextStates = APPLICATION_FLOW[current];

  if (!allowedNextStates.includes(next)) {
    throw new Error(
      `Invalid transition: ${current} → ${next}`
    );
  }
}
module.exports={APPLICATION_FLOW,validateApplicationTransition}