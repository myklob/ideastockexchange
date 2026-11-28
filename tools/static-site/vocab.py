"""What a post can be: one shared list of the kinds of thing a person (or a program) can add to a page, each saying
where it is filed, which number it can move once it is argued, and what it is called in the published standards
for exchanging arguments, so a post made here means the same thing to anyone who reads it elsewhere.

Every type resolves to a place the two tables already have: a section and a side on the page being read (target
"page"), the same on one of a row's own pages (target "claim" for the row's claim page; "link", "imp", "uniq" or
"equiv" for the page that argues its relevance, importance, distinctness or sameness), or a cell of a topic page.
Nothing here adds a scoring rule. A tag rides on the row in its extra cell (`tag: link.irrelevant`) and no scorer
reads it: what a row is worth comes from its claim being argued, exactly as before.

The outside names, so a port or another site can line up with this one:
  aif      the Argument Interchange Format (Chesnevar, Rahwan, Reed and others, Knowledge Engineering Review, 2006):
           I is a claim; RA an inference, which is what a reason for something is; CA a conflict, a reason
           against; PA a preference, one thing outweighing another; MA a rephrase, one claim restating another.
  attack   the three ways an objection can land, as ASPIC+ names them (Prakken, Argument and Computation, 2010):
           rebut, against the conclusion itself; undercut, against the step from reason to conclusion, which is
           what a linkage page argues; undermine, against a reason's own truth, which is what its claim page argues.
  scheme   the argumentation scheme a reason follows, by the names in Walton, Reed and Macagno, Argumentation
           Schemes (Cambridge, 2008), each with its critical questions; a "no" to one is a post of a known type.
  schema   the schema.org type the thing is, where one exists (Claim is still a pending type there).
"""

FAMILIES = [
    ('truth', 'Is it true?', 'Reasons for and against the claim on the page you are reading.'),
    ('scheme', 'What kind of reason is it?', 'The recognized patterns a reason can follow. Each comes with the questions that test it; a "no" to one of them is a post of its own.'),
    ('link', 'Does it bear on the conclusion?', 'Whether a reason, if true, would really move the claim it is listed under. Filed on that row\'s linkage page.'),
    ('imp', 'How much does it matter?', 'Whether a row carries a lot of weight or a little. Filed on that row\'s importance page.'),
    ('uniq', 'Is it a new point?', 'Whether a row says something no other row on the page already says. Filed on that row\'s uniqueness page.'),
    ('evidence', 'What was observed?', 'Findings, by the kind of source they rest on. The kind sets where the finding\'s own page starts.'),
    ('challenge', 'Is the evidence sound?', 'Reasons a finding is weaker than it looks. Filed on the finding\'s own page as a reason to disagree.'),
    ('test', 'How would we know?', 'Measures that would settle the question, and predictions that could come true or false.'),
    ('cba', 'What does it cost, and who gains?', 'Costs and benefits if the belief is true and people act on it, and who pays or gains.'),
    ('interest', 'Whose interests and which values?', 'The people with something at stake, what they need, and the values each side ranks highest.'),
    ('meaning', 'What does it mean?', 'Definitions, the premises a belief is made of, what it takes for granted, and stronger or weaker versions of it.'),
    ('source', 'Who said it, and where?', 'Works, people on the record, and laws or rulings that bear on the claim.'),
    ('fallacy', 'Is the reasoning flawed?', 'An accusation that a reason commits a named mistake. It is a claim like any other: filed on the row\'s linkage page as a reason to disagree, it moves nothing until it is argued.'),
    ('house', 'Keeping the site in order', 'Votes, duplicates, corrections and proposals. None of these moves a score.'),
]

# id, family, label, target, section, side, moves, aif, attack, schema, example
# target: page | claim | link | imp | uniq | equiv | topic | none.  side: agree | disagree | either | '' (no sides)
# moves: the number this post can move once its claim is argued; '' for one that moves nothing.
_T = [
    # ---------------------------------------------------------------------------------------------- is it true?
    ('truth.reason-for', 'truth', 'A reason to agree', 'page', 'argument', 'agree', 'truth', 'RA', '', 'Claim',
     'Postal infrastructure already reaches every zip code.'),
    ('truth.reason-against', 'truth', 'A reason to disagree', 'page', 'argument', 'disagree', 'truth', 'CA', 'rebut', 'Claim',
     'Most rural post offices have cut their hours since 2011.'),
    ('truth.counterexample', 'truth', 'A counterexample to a general claim', 'page', 'argument', 'disagree', 'truth', 'CA', 'rebut', 'Claim',
     'Finland cut class sizes and its test scores fell anyway.'),
    ('truth.exception', 'truth', 'An exception that limits a claim', 'page', 'argument', 'disagree', 'truth', 'CA', 'rebut', 'Claim',
     'The rule does not hold for towns under 2,000 people, where one store serves everyone.'),
    ('truth.premise-false', 'truth', 'A reason a row\'s claim is false', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The 2019 survey cited for this reason asked only urban households.'),
    ('truth.premise-true', 'truth', 'A reason a row\'s claim is true', 'claim', 'argument', 'agree', 'truth', 'RA', '', 'Claim',
     'Three later surveys with rural samples found the same share.'),
    ('truth.impact-for', 'truth', 'A reason a work or a person has had real influence', 'page', 'impact', 'agree', 'truth', 'RA', '', 'Claim',
     'The report is cited in the committee\'s final bill text.'),
    ('truth.impact-against', 'truth', 'A reason a work or a person has had little influence', 'page', 'impact', 'disagree', 'truth', 'CA', 'rebut', 'Claim',
     'No court or agency has cited the study since it was published.'),
    ('truth.upstream', 'truth', 'A broader belief this one follows from', 'page', 'upstream', 'either', '', 'RA', '', 'Claim',
     'Governments should provide services markets will not reach.'),
    ('truth.downstream', 'truth', 'A narrower belief that follows from this one', 'page', 'downstream', 'either', '', 'RA', '', 'Claim',
     'Rural post offices should stay open six days a week.'),

    # -------------------------------------------------------------------------------------- does it bear on it?
    ('link.relevant', 'link', 'A reason a row bears on the conclusion', 'link', 'argument', 'agree', 'link', 'RA', '', 'Claim',
     'If trading on committee information is common, a ban removes exactly the conflict at issue.'),
    ('link.irrelevant', 'link', 'A reason a row does not bear on the conclusion', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'Even if members trade often, that says nothing about whether they trade on what they learn in committee.'),
    ('link.weaker-only', 'link', 'A row supports only a weaker version of the claim', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'The finding shows prices rose, not that they will keep rising.'),
    ('link.wrong-side', 'link', 'A row actually supports the other side', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'Lower turnout among young voters helps the incumbent, so this row counts against the belief it is filed for.'),
    ('link.does-not-follow', 'link', 'The conclusion does not follow from the row', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'A company being profitable does not show its prices are fair.'),
    ('link.other-explanation', 'link', 'Something else explains what the row points to', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'The drop in crime also happened in cities that never adopted the program.'),
    ('link.only-in-some-cases', 'link', 'A row holds only in cases the claim does not cover', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'The study covered hospitals with more than 500 beds; the belief is about all hospitals.'),
    ('link.diagnostic', 'link', 'A prediction or test really tells the two sides apart', 'link', 'argument', 'agree', 'link', 'RA', '', 'Claim',
     'Only a real El Nino of this size would push the January index above 2.0.'),
    ('link.not-diagnostic', 'link', 'A prediction would come true either way', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'Prices rise most years, so a rise next year would not show the policy worked.'),
    ('link.interest-bears', 'link', 'A reason an interest really is at stake in a row', 'link', 'argument', 'agree', 'link', 'RA', '', 'Claim',
     'Renters pay the tax through higher rents, so their budgets are at stake.'),
    ('link.interest-does-not-bear', 'link', 'A reason an interest listed for a row is not really at stake', 'link', 'argument', 'disagree', 'link', 'CA', 'undercut', 'Claim',
     'The rule exempts owner-occupied homes, so homeowners are not affected by it.'),

    # ------------------------------------------------------------------------------------------- how much?
    ('imp.interest', 'imp', 'An interest a row bears on', 'imp', 'interest_listing', '', 'imp', 'PA', '', 'Claim',
     'Voters need to know whether an official holds a stake in the decisions they make.'),
    ('imp.more', 'imp', 'A reason a row matters more than it looks', 'imp', 'argument', 'agree', 'imp', 'PA', '', 'Claim',
     'The cost falls on the poorest tenth of households, who have the least slack.'),
    ('imp.less', 'imp', 'A reason a row matters less than it looks', 'imp', 'argument', 'disagree', 'imp', 'PA', '', 'Claim',
     'The effect is under a dollar a month for the typical household.'),
    ('imp.many-people', 'imp', 'A row affects many people', 'imp', 'argument', 'agree', 'imp', 'PA', '', 'Claim',
     'The rule covers every one of the 140 million taxpayers.'),
    ('imp.few-people', 'imp', 'A row affects few people', 'imp', 'argument', 'disagree', 'imp', 'PA', '', 'Claim',
     'Fewer than 300 firms meet the size threshold.'),
    ('imp.lasting', 'imp', 'A row\'s effect lasts or cannot be undone', 'imp', 'argument', 'agree', 'imp', 'PA', '', 'Claim',
     'A species that goes extinct does not come back.'),
    ('imp.brief', 'imp', 'A row\'s effect is brief or easy to reverse', 'imp', 'argument', 'disagree', 'imp', 'PA', '', 'Claim',
     'The next legislature can repeal the rule with a simple majority.'),
    ('imp.central', 'imp', 'A row goes to the heart of the decision', 'imp', 'argument', 'agree', 'imp', 'PA', '', 'Claim',
     'Whether the program works at all is the whole question; cost comes second.'),
    ('imp.side-issue', 'imp', 'A row is a side issue', 'imp', 'argument', 'disagree', 'imp', 'PA', '', 'Claim',
     'The logo redesign is a few thousand dollars in a ten-billion-dollar budget.'),

    # ----------------------------------------------------------------------------------------- a new point?
    ('uniq.duplicate', 'uniq', 'A row makes the same point as another row', 'uniq', 'argument', 'disagree', 'uniq', 'MA', '', 'Claim',
     'Both rows rest on the same 2019 survey, so counting both counts it twice.'),
    ('uniq.overlap', 'uniq', 'A row overlaps another row in part', 'uniq', 'argument', 'disagree', 'uniq', 'MA', '', 'Claim',
     'The finding adds dates to the argument above it but no new reason.'),
    ('uniq.same-cause', 'uniq', 'Two rows are one cause counted twice', 'uniq', 'argument', 'disagree', 'uniq', 'MA', '', 'Claim',
     'Higher rents and longer commutes are both the housing shortage, listed twice.'),
    ('uniq.distinct', 'uniq', 'A row makes a different point from another row', 'uniq', 'argument', 'agree', 'uniq', 'MA', '', 'Claim',
     'One row is about what the rule covers and the other about whether it is enforced.'),
    ('uniq.same-claim', 'uniq', 'Two pages say the same thing in other words', 'equiv', 'argument', 'agree', '', 'MA', '', 'Claim',
     '"Tariffs raise prices" and "import taxes cost consumers" are the same claim.'),
    ('uniq.different-claim', 'uniq', 'Two similar-sounding pages are different claims', 'equiv', 'argument', 'disagree', '', 'MA', '', 'Claim',
     'A ban removes ownership; a blind trust removes only control.'),

    # ---------------------------------------------------------------------------------------- what was seen?
    ('evidence.statistics', 'evidence', 'Statistics or data, with the source named', 'page', 'evidence', 'either', 'truth', 'I', '', 'Dataset',
     'The Census Bureau counted 4.2 million housing starts from 2015 to 2019.'),
    ('evidence.record', 'evidence', 'An official record: a statute, ruling, agency rule or sworn filing', 'page', 'evidence', 'either', 'truth', 'I', '', 'Legislation',
     'The court\'s September 2025 order declined to require a sale of Chrome.'),
    ('evidence.rct', 'evidence', 'A randomized controlled trial', 'page', 'evidence', 'either', 'truth', 'I', '', 'ScholarlyArticle',
     'In the 2023 trial, the treated group lost 15 percent of body weight against 2 percent on placebo.'),
    ('evidence.meta', 'evidence', 'A meta-analysis of many studies', 'page', 'evidence', 'either', 'truth', 'I', '', 'ScholarlyArticle',
     'A review of 41 trials found no effect on test scores beyond the first year.'),
    ('evidence.observational', 'evidence', 'An observational or correlational study', 'page', 'evidence', 'either', 'truth', 'I', '', 'ScholarlyArticle',
     'Counties that expanded the program saw 6 percent fewer emergency visits.'),
    ('evidence.historical', 'evidence', 'A historical trend, with references', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'Every El Nino stronger than 2.0 since 1950 was followed by a record year.'),
    ('evidence.expert-data', 'evidence', 'Expert testimony backed by data', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'The forecaster\'s model, run on five datasets, gives 85 percent odds.'),
    ('evidence.expert-claim', 'evidence', 'An expert\'s claim or a public statement', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'The agency head told reporters the program would pay for itself.'),
    ('evidence.anecdote', 'evidence', 'A personal experience or anecdote', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'My clinic waited eleven weeks for the device.'),
    ('evidence.logic', 'evidence', 'Common sense or plain logic', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'A ban cannot be broken by people it does not apply to.'),
    ('evidence.analogy', 'evidence', 'An analogy or comparison', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'The Federal Reserve already bars its own officials from trading.'),
    ('evidence.norm', 'evidence', 'A cultural norm', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'Most people expect a judge to step aside from a case involving family.'),
    ('evidence.intuition', 'evidence', 'An intuition or gut feeling, said as one', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'Paying people not to work feels likely to reduce work.'),
    ('evidence.news', 'evidence', 'A news or media report', 'page', 'evidence', 'either', 'truth', 'I', '', 'NewsArticle',
     'Reuters reported on October 3 that talks had resumed.'),
    ('evidence.survey', 'evidence', 'A survey or poll of what people believe', 'page', 'evidence', 'either', 'truth', 'I', '', 'Dataset',
     'A Gallup poll found 58 percent support the proposal.'),
    ('evidence.eyewitness', 'evidence', 'Eyewitness testimony', 'page', 'evidence', 'either', 'truth', 'I', '', 'Claim',
     'Two inspectors testified that the valve was open.'),
    ('evidence.visual', 'evidence', 'A photo, video or other visual record', 'page', 'evidence', 'either', 'truth', 'I', '', 'ImageObject',
     'Satellite images show the dam reservoir at a tenth of capacity.'),
    ('evidence.artifact', 'evidence', 'A historical artifact', 'page', 'evidence', 'either', 'truth', 'I', '', 'CreativeWork',
     'The surviving ledger records 1,200 shipments in 1851.'),
    ('evidence.replication', 'evidence', 'A replication of a finding, or a failure to replicate it', 'claim', 'evidence', 'either', 'truth', 'I', '', 'ScholarlyArticle',
     'A 2021 study repeated the experiment with 2,000 people and found no effect.'),

    # ---------------------------------------------------------------------------------------- is it sound?
    ('challenge.small-sample', 'challenge', 'The sample is too small to show this', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The study followed 31 people for six weeks.'),
    ('challenge.unrepresentative', 'challenge', 'The sample does not represent the people the claim is about', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'Every participant was a college student in one city.'),
    ('challenge.funding', 'challenge', 'The source has a stake in the result', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The trial was paid for and run by the drug\'s maker.'),
    ('challenge.misquoted', 'challenge', 'The figure is not what the source says', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The report gives 14 percent, not 41.'),
    ('challenge.outdated', 'challenge', 'The finding is out of date', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The data are from 2009, before the law changed.'),
    ('challenge.cherry-picked', 'challenge', 'The time window or cases were picked to suit the result', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'Starting the chart in 1998, a record El Nino year, hides the trend.'),
    ('challenge.retracted', 'challenge', 'The study was retracted or corrected', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The journal retracted the paper in 2010.'),
    ('challenge.not-replicated', 'challenge', 'Others tried and failed to repeat the finding', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'Four labs repeated the experiment and none found the effect.'),
    ('challenge.proxy', 'challenge', 'It measured something other than what the claim is about', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The study measured enrollment, not learning.'),
    ('challenge.confounded', 'challenge', 'Something else could explain the result', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The towns that adopted the program were also richer.'),
    ('challenge.survivorship', 'challenge', 'Only the cases that survived were counted', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The study looked only at companies still in business ten years later.'),
    ('challenge.base-rate', 'challenge', 'The figure means little without the base rate', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'Doubling a one-in-a-million risk is still a two-in-a-million risk.'),
    ('challenge.multiple-tests', 'challenge', 'Many outcomes were tested and only the one that worked was reported', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The paper measured twenty outcomes and reported one.'),
    ('challenge.sound', 'challenge', 'A reason a finding holds up', 'claim', 'argument', 'agree', 'truth', 'RA', '', 'Claim',
     'The result was preregistered and repeated in three countries.'),

    # ------------------------------------------------------------------------------------ how would we know?
    ('test.criterion', 'test', 'A measure that would settle the question', 'page', 'criterion', '', '', 'I', '', 'Claim',
     'Median rent as a share of median income is a fair measure of affordability.'),
    ('test.criterion-invalid', 'test', 'A reason a measure would not settle the question', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'Median rent ignores the people who have already moved away.'),
    ('test.prediction-if-true', 'test', 'Something that will happen if the belief is true', 'page', 'prediction', 'agree', 'truth', 'I', '', 'Claim',
     'January to June 2027 will run warmer than January to June 2024 in Copernicus data.'),
    ('test.prediction-if-false', 'test', 'Something that will happen if the belief is false', 'page', 'prediction', 'disagree', 'truth', 'I', '', 'Claim',
     'NOAA will declare the El Nino over by spring 2027.'),
    ('test.would-confirm', 'test', 'An observation that would strongly confirm the belief', 'page', 'falsify', 'agree', '', 'I', '', 'Claim',
     'A peak index of 2.5 or more this winter.'),
    ('test.would-refute', 'test', 'An observation that would refute the belief', 'page', 'falsify', 'disagree', '', 'I', '', 'Claim',
     'A La Nina advisory before the end of summer 2027.'),
    ('test.came-true', 'test', 'A report that a prediction came true', 'claim', 'evidence', 'agree', 'truth', 'I', '', 'Claim',
     'Copernicus reported January to June 2027 at 1.68 degrees, above 2024.'),
    ('test.came-false', 'test', 'A report that a prediction did not come true', 'claim', 'evidence', 'disagree', 'truth', 'I', '', 'Claim',
     'The deadline passed with no ceasefire signed.'),

    # ---------------------------------------------------------------------------------- what does it cost?
    ('cba.benefit', 'cba', 'A benefit if the belief is true and acted on', 'page', 'cba', 'agree', '', 'I', '', 'Claim',
     'Cities that prepare for record heat will have fewer heat deaths.'),
    ('cba.cost', 'cba', 'A cost if the belief is true and acted on', 'page', 'cba', 'disagree', '', 'I', '', 'Claim',
     'Summer power bills will rise in hot regions.'),
    ('cba.estimate', 'cba', 'An estimate of a cost or benefit, with a range and units', 'page', 'cba', 'either', '', 'I', '', 'QuantitativeValue',
     'Between 40 and 90 dollars a year per household, central 60.'),
    ('cba.unlikely', 'cba', 'A reason a cost or benefit will not happen', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The utility has already locked in prices through 2028.'),
    ('cba.likely', 'cba', 'A reason a cost or benefit will happen', 'claim', 'argument', 'agree', 'truth', 'RA', '', 'Claim',
     'Every past heat wave raised peak demand by at least 8 percent.'),
    ('cba.smaller', 'cba', 'A reason a cost or benefit is smaller than claimed', 'imp', 'argument', 'disagree', 'imp', 'PA', '', 'Claim',
     'Most households in the region already pay a flat summer rate.'),
    ('cba.larger', 'cba', 'A reason a cost or benefit is larger than claimed', 'imp', 'argument', 'agree', 'imp', 'PA', '', 'Claim',
     'The estimate leaves out businesses, which use most of the power.'),
    ('cba.short-term', 'cba', 'A short-term effect', 'page', 'short_term', '', '', 'I', '', 'Claim',
     'Single-year warming will again pass 1.5 degrees.'),
    ('cba.long-term', 'cba', 'A long-term effect', 'page', 'long_term', '', '', 'I', '', 'Claim',
     'Annual forecasts will become a trusted planning tool for insurers.'),
    ('cba.side-effect', 'cba', 'An unintended side effect', 'page', 'cba', 'either', '', 'I', '', 'Claim',
     'Landlords may convert rentals to condos to escape the cap.'),
    ('cba.opportunity-cost', 'cba', 'What the same money or effort could do instead', 'page', 'cba', 'disagree', '', 'I', '', 'Claim',
     'The same funds would pay for 400 more teachers.'),
    ('cba.who-pays', 'cba', 'Who pays a cost or gains a benefit', 'page', 'cba', 'either', '', 'I', '', 'Audience',
     'Electricity customers in hot regions pay it.'),
    ('cba.obstacle', 'cba', 'An obstacle to acting on the belief', 'page', 'obstacle', 'either', '', 'I', '', 'Claim',
     'The change needs approval from two agencies that disagree.'),
    ('cba.compromise', 'cba', 'A compromise both sides could accept', 'page', 'compromise', '', '', 'I', '', 'Claim',
     'Require a blind trust for five years, then review the results.'),

    # --------------------------------------------------------------------------------- whose interests?
    ('interest.served', 'interest', 'A group whose need is served if the belief is true', 'page', 'interest', 'agree', '', 'I', '', 'Audience',
     'City public health departments need early warning of record heat.'),
    ('interest.harmed', 'interest', 'A group whose need is harmed if the belief is true', 'page', 'interest', 'disagree', '', 'I', '', 'Audience',
     'Electricity customers in hot regions need summer bills they can afford.'),
    ('interest.shared', 'interest', 'An interest both sides share', 'page', 'shared_interest', '', '', 'I', '', 'Audience',
     'Both sides want the forecast judged by the published numbers.'),
    ('interest.valid', 'interest', 'A reason an interest is legitimate', 'claim', 'argument', 'agree', 'truth', 'RA', '', 'Claim',
     'Tenants have a reasonable claim to stable housing costs.'),
    ('interest.not-valid', 'interest', 'A reason an interest is not legitimate', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'No one has a legitimate interest in trading on information the public cannot see.'),
    ('interest.value', 'interest', 'A value each side ranks, and how high', 'page', 'value', '', '', 'PA', '', 'DefinedTerm',
     'Accuracy: both sides rank it first.'),
    ('interest.motive', 'interest', 'An advertised reason set beside what the record suggests', 'page', 'motive', 'either', '', 'I', '', 'Claim',
     'Advertised: public safety. Record: the sponsor\'s largest donor sells the equipment.'),
    ('interest.bias', 'interest', 'A bias that pulls one side', 'page', 'bias', 'either', '', 'I', '', 'Claim',
     'Fans of a team tend to overrate its odds.'),
    ('interest.at-stake', 'interest', 'An interest at stake, with no side yet', 'page', 'interest_listing', '', '', 'I', '', 'Audience',
     'Commuters who cross the bridge twice a day.'),

    # ---------------------------------------------------------------------------------- what does it mean?
    ('meaning.definition', 'meaning', 'A definition of a term the page turns on', 'page', 'definition', '', '', 'I', '', 'DefinedTerm',
     'Ceasefire: both governments announce an end to fire and it holds for 30 days.'),
    ('meaning.dispute', 'meaning', 'Where the two sides really disagree, and what would move it', 'page', 'dispute', '', '', 'I', '', 'Question',
     'Whether an El Nino this large adds as much heat as smaller ones did.'),
    ('meaning.ambiguous', 'meaning', 'A word that is used in two senses', 'page', 'definition', '', '', 'I', '', 'DefinedTerm',
     '"Affordable" means 30 percent of income to one side and below market rate to the other.'),
    ('meaning.component', 'meaning', 'A premise the belief is made of', 'page', 'component', '', 'truth', 'I', '', 'Claim',
     'NASA and Copernicus will keep publishing comparable annual figures.'),
    ('meaning.assumption-for', 'meaning', 'Something a supporter takes for granted', 'page', 'assumption', 'agree', '', 'I', '', 'Claim',
     'The heat of 2023 and 2024 came mostly from lasting causes.'),
    ('meaning.assumption-against', 'meaning', 'Something an opponent takes for granted', 'page', 'assumption', 'disagree', '', 'I', '', 'Claim',
     'The heat of 2024 included a temporary boost.'),
    ('meaning.stronger', 'meaning', 'A stronger version of the belief', 'page', 'similar', 'agree', '', 'MA', '', 'Claim',
     '2027 will beat 2024 by at least a tenth of a degree.'),
    ('meaning.weaker', 'meaning', 'A weaker version of the belief', 'page', 'similar', 'disagree', '', 'MA', '', 'Claim',
     '2027 will be among the three hottest years on record.'),
    ('meaning.opposite', 'meaning', 'The opposite claim, which needs its own page', 'none', '', '', '', 'CA', 'rebut', 'Claim',
     'Rent control does not reduce the supply of rental housing.'),
    ('meaning.compound', 'meaning', 'A claim that is really two claims and should be split', 'none', '', '', '', '', '', 'Claim',
     '"The tax is unfair and will not raise much" is two claims.'),

    # -------------------------------------------------------------------------------------- who said it?
    ('source.book', 'source', 'A book', 'page', 'media', 'either', 'truth', 'I', '', 'Book', 'Evicted, Matthew Desmond, 2016'),
    ('source.study', 'source', 'A study', 'page', 'media', 'either', 'truth', 'I', '', 'ScholarlyArticle', 'Abnormal Returns from the Common Stock Investments of the U.S. Senate, Ziobrowski and others, 2004'),
    ('source.article', 'source', 'An article', 'page', 'media', 'either', 'truth', 'I', '', 'Article', 'Climate models can\'t explain 2023\'s huge heat anomaly, Gavin Schmidt, 2024'),
    ('source.report', 'source', 'A report', 'page', 'media', 'either', 'truth', 'I', '', 'Report', 'State of the Climate, NOAA, 2025'),
    ('source.film', 'source', 'A film', 'page', 'media', 'either', 'truth', 'I', '', 'Movie', 'An Inconvenient Truth, Davis Guggenheim, 2006'),
    ('source.podcast', 'source', 'A podcast', 'page', 'media', 'either', 'truth', 'I', '', 'PodcastEpisode', 'an episode with its show, host and date'),
    ('source.video', 'source', 'A video', 'page', 'media', 'either', 'truth', 'I', '', 'VideoObject', 'a lecture or interview with its channel and date'),
    ('source.person', 'source', 'A person on the record, for or against', 'page', 'person', 'either', '', 'I', '', 'Person',
     'Climate scientist Zeke Hausfather put 2027 at 85 percent in a July 2026 analysis.'),
    ('source.law', 'source', 'A law or ruling that bears on the claim', 'page', 'law', 'either', '', 'I', '', 'Legislation',
     'The STOCK Act of 2012 requires members to report trades within 45 days.'),
    ('source.misquote', 'source', 'A person or work is quoted wrongly', 'claim', 'argument', 'disagree', 'truth', 'CA', 'undermine', 'Claim',
     'The quoted line is from a critic of the author, not the author.'),

    # ---------------------------------------------------------------------------------- keeping order
    ('house.vote', 'house', 'A vote for or against a claim', 'none', '', 'either', '', '', '', 'VoteAction',
     'Shown beside the score and never read by it.'),
    ('house.duplicate', 'house', 'A report that two pages are the same claim', 'none', '', '', '', 'MA', '', 'Claim',
     'Merged as a vote for the page already there.'),
    ('house.correction', 'house', 'A correction to a figure, date or name, with the source', 'none', '', '', '', '', '', 'CorrectionComment',
     'The source gives May 17, not May 7.'),
    ('house.loaded-wording', 'house', 'Wording that takes one side\'s terms for granted', 'none', '', '', '', '', '', 'Comment',
     '"Death tax" and "estate tax" name the same tax.'),
    ('house.missing-source', 'house', 'A request for a source', 'none', '', '', '', '', '', 'Comment',
     'Which survey gives the 58 percent?'),
    ('house.broken-link', 'house', 'A link that goes nowhere', 'none', '', '', '', '', '', 'Comment',
     'The source link on the third finding returns a 404.'),
    ('house.new-belief', 'house', 'A proposed belief', 'none', '', '', '', 'I', '', 'Claim',
     'Rural post offices should stay open six days a week.'),
    ('house.new-topic', 'house', 'A proposed topic', 'none', '', '', '', '', '', 'DefinedTerm',
     'Water rights'),
]

# The argumentation schemes, each filed as a reason (truth.reason-for or truth.reason-against with tag
# scheme.<name>), with its critical questions. A question answered "no" is a post: an undercut goes on the row's
# linkage page as a reason to disagree, an undermine on the row's own claim page as a reason to disagree.
SCHEMES = [
    ('expert-opinion', 'From expert opinion', 'An expert in the field says so.', [
        ('Is the source an expert in the field this claim is in?', 'undercut'),
        ('Did the expert actually say this, in these terms?', 'undermine'),
        ('Is the expert personally reliable and free of a stake in the answer?', 'undercut'),
        ('Do other experts in the field agree?', 'undercut'),
        ('Is the expert\'s view based on evidence?', 'undercut')]),
    ('position-to-know', 'From a witness in a position to know', 'Someone placed to know reports it.', [
        ('Was the witness really in a position to know?', 'undercut'),
        ('Is the witness honest?', 'undercut'),
        ('Did the witness say this?', 'undermine')]),
    ('analogy', 'From analogy', 'A similar case turned out this way.', [
        ('Is the claim true of the other case?', 'undermine'),
        ('Are the two cases alike in the way that matters?', 'undercut'),
        ('Is there a third case, just as similar, that turned out the other way?', 'undercut')]),
    ('cause-to-effect', 'From cause to effect', 'This cause generally produces that effect.', [
        ('How strong is the link between cause and effect?', 'undercut'),
        ('Is the evidence for that link good?', 'undermine'),
        ('Could something interfere with the cause producing the effect here?', 'undercut')]),
    ('correlation-to-cause', 'From correlation to cause', 'The two move together, so one causes the other.', [
        ('Do they really move together, over enough cases?', 'undermine'),
        ('Could a third thing cause both?', 'undercut'),
        ('Could the effect be causing the cause?', 'undercut')]),
    ('sign', 'From a sign', 'This usually goes with that, and this is present.', [
        ('How reliably does the sign go with what it signals?', 'undercut'),
        ('Is something else a better account of the sign?', 'undercut')]),
    ('example', 'From examples', 'Here are cases where it held.', [
        ('Are the examples true?', 'undermine'),
        ('Are they typical?', 'undercut'),
        ('Are there counterexamples?', 'undercut')]),
    ('consequences', 'From consequences', 'Doing it would lead to good (or bad) outcomes.', [
        ('How likely are those outcomes?', 'undermine'),
        ('What is the evidence they would follow?', 'undermine'),
        ('Are there outcomes of the opposite value to weigh?', 'undercut')]),
    ('practical', 'From a goal to an action', 'We want this, and this action gets it.', [
        ('Are there other ways to the goal?', 'undercut'),
        ('Is the action possible?', 'undermine'),
        ('Does the goal conflict with other goals?', 'undercut'),
        ('Does the action have side effects that outweigh the goal?', 'undercut')]),
    ('popular-opinion', 'From popular opinion', 'Most people accept it.', [
        ('Do most people really accept it?', 'undermine'),
        ('Even if they do, is there reason to doubt it?', 'undercut')]),
    ('precedent', 'From precedent', 'A past decision settled a case like this.', [
        ('Is the earlier case really like this one?', 'undercut'),
        ('Has the precedent been overturned or limited?', 'undermine')]),
    ('rule', 'From an established rule', 'A rule that applies here says so.', [
        ('Does the rule apply to this case?', 'undercut'),
        ('Is this case an exception the rule allows?', 'undercut'),
        ('Is the rule valid and binding?', 'undermine')]),
    ('classification', 'From classification', 'It belongs to a kind, and that kind has this property.', [
        ('Is the kind defined clearly enough to sort this case?', 'undercut'),
        ('Does this case really belong to the kind?', 'undermine')]),
    ('definition', 'From definition', 'By what the word means, it follows.', [
        ('Is the definition the one both sides use?', 'undercut'),
        ('Does the case meet the definition?', 'undermine')]),
    ('commitment', 'From commitment', 'You already accepted something that implies this.', [
        ('Is the person really committed to it?', 'undermine'),
        ('Does the commitment really imply this?', 'undercut'),
        ('Has the person since changed position, with reason?', 'undercut')]),
    ('lack-of-evidence', 'From lack of evidence', 'No one has found it, so it is not so.', [
        ('How hard has anyone looked?', 'undercut'),
        ('Would it be known by now if it were true?', 'undercut'),
        ('Which side has to show its case?', 'undercut')]),
    ('best-explanation', 'From the best explanation', 'This explains what we see better than the alternatives.', [
        ('Does it explain what we see?', 'undermine'),
        ('Is there a better explanation?', 'undercut'),
        ('How far has the search for alternatives gone?', 'undercut')]),
    ('waste', 'From waste', 'Stopping now would waste what has been spent.', [
        ('Is going on possible and worth it from here?', 'undercut'),
        ('Is what was spent lost whatever we do?', 'undercut')]),
    ('slippery-slope', 'From a slippery slope', 'One step leads by stages to an outcome.', [
        ('What are the steps between the first and the last?', 'undercut'),
        ('What is the evidence each step is likely?', 'undermine'),
        ('Is there a point where it could be stopped?', 'undercut')]),
    ('values', 'From values', 'It serves (or betrays) a value we hold.', [
        ('Is the value one both sides hold?', 'undercut'),
        ('Does it conflict with a value ranked higher?', 'undercut')]),
    ('fairness', 'From fairness', 'Like cases should be treated alike.', [
        ('Are the cases alike in the way that matters?', 'undercut'),
        ('Is there a reason to treat them differently?', 'undercut')]),
    ('alternatives', 'From alternatives', 'The other options are ruled out, so this one.', [
        ('Are the options listed all the options?', 'undercut'),
        ('Has each other option really been ruled out?', 'undermine')]),
    ('evidence-to-hypothesis', 'From evidence to a hypothesis', 'If it were true we would see this, and we do.', [
        ('Would we see this even if it were false?', 'undercut'),
        ('Was it really observed?', 'undermine')]),
    ('composition', 'From parts to the whole, or the whole to its parts', 'What holds of the parts holds of the whole, or the reverse.', [
        ('Does this property really carry from parts to whole (or whole to parts)?', 'undercut')]),
    ('bias', 'From bias', 'The source has a reason to say this whether or not it is true.', [
        ('Is there evidence of the bias?', 'undermine'),
        ('Does the bias bear on this particular claim?', 'undercut')]),
]

# Fallacy accusations. Each is filed on the row's linkage page as a reason to disagree (an undercut), or on the
# row's own claim page (an undermine) where the mistake is in what the row asserts rather than in the step it
# makes; fallacy.py flags the first nine by wording, and a flag, like an accusation, moves nothing until argued.
FALLACIES = [
    ('ad-hominem', 'Attacking the person', 'answers who said a thing instead of whether it is true', 'undercut'),
    ('tu-quoque', 'Pointing at the other side', 'answers a criticism by saying the critic does the same thing', 'undercut'),
    ('popularity', 'Appeal to popularity', 'treats how many believe a claim as evidence that it is true', 'undercut'),
    ('authority', 'Appeal to authority', 'rests a claim on who endorses it rather than on the evidence they had', 'undercut'),
    ('slippery-slope', 'Slippery slope', 'claims a first step will lead to an extreme outcome without showing each step', 'undercut'),
    ('false-choice', 'False choice', 'presents two options as the only ones when others exist', 'undercut'),
    ('sweeping', 'Sweeping generalization', 'states a rule with no exceptions where exceptions are likely', 'undermine'),
    ('tradition', 'Appeal to tradition', 'treats a practice as right because it is old', 'undercut'),
    ('post-hoc', 'After, therefore because of', 'concludes that one thing caused another because it came first', 'undercut'),
    ('straw-man', 'Straw man', 'answers a weaker version of the other side than the one it holds', 'undercut'),
    ('red-herring', 'Red herring', 'changes the subject to something easier to win', 'undercut'),
    ('circular', 'Circular reasoning', 'assumes what it sets out to show', 'undercut'),
    ('hasty', 'Hasty generalization', 'draws a rule from too few cases', 'undercut'),
    ('correlation', 'Correlation taken for cause', 'treats two things moving together as one causing the other', 'undercut'),
    ('emotion', 'Appeal to emotion', 'moves feeling in place of giving a reason', 'undercut'),
    ('fear', 'Appeal to fear', 'argues from what is frightening rather than what is likely', 'undercut'),
    ('pity', 'Appeal to pity', 'argues from sympathy rather than from the merits', 'undercut'),
    ('nature', 'Appeal to nature', 'treats natural as good or unnatural as bad', 'undercut'),
    ('novelty', 'Appeal to novelty', 'treats new as better because it is new', 'undercut'),
    ('ignorance', 'Appeal to ignorance', 'treats a lack of proof against as proof for, or the reverse', 'undercut'),
    ('burden', 'Shifting the burden', 'demands the other side disprove a claim nobody has shown', 'undercut'),
    ('goalposts', 'Moving the goalposts', 'raises the bar once the first one is met', 'undercut'),
    ('no-true-scotsman', 'No true Scotsman', 'redefines a group to exclude the counterexample', 'undercut'),
    ('equivocation', 'Equivocation', 'uses one word in two senses within the same argument', 'undercut'),
    ('loaded-question', 'Loaded question', 'asks a question that assumes the answer in dispute', 'undercut'),
    ('composition', 'Composition', 'assumes what is true of the parts is true of the whole', 'undercut'),
    ('division', 'Division', 'assumes what is true of the whole is true of each part', 'undercut'),
    ('genetic', 'Genetic fallacy', 'judges a claim by where it came from rather than by the evidence', 'undercut'),
    ('special-pleading', 'Special pleading', 'exempts one case from a rule without a reason', 'undercut'),
    ('cherry-picking', 'Cherry picking', 'cites the cases that fit and leaves out the ones that do not', 'undermine'),
    ('sharpshooter', 'Texas sharpshooter', 'draws the target around the cluster after the fact', 'undermine'),
    ('gamblers', 'Gambler\'s fallacy', 'expects chance to even out in the short run', 'undercut'),
    ('sunk-cost', 'Sunk cost', 'keeps going because of what has already been spent', 'undercut'),
    ('middle-ground', 'Middle ground', 'assumes the truth lies halfway between two claims', 'undercut'),
    ('anecdotal', 'Anecdote over evidence', 'sets one story against the weight of the data', 'undercut'),
    ('incredulity', 'Personal incredulity', 'treats finding something hard to believe as a reason it is false', 'undercut'),
    ('poisoning-the-well', 'Poisoning the well', 'discredits a source in advance so nothing it says is heard', 'undercut'),
    ('guilt-by-association', 'Guilt by association', 'rejects a claim because disliked people also hold it', 'undercut'),
    ('consequences-of-belief', 'Appeal to consequences', 'argues a claim is false because believing it would be bad', 'undercut'),
    ('perfect-solution', 'Perfect solution', 'rejects a remedy because it does not solve everything', 'undercut'),
    ('false-equivalence', 'False equivalence', 'treats two things as alike when they differ in the way that matters', 'undercut'),
    ('motte-and-bailey', 'Motte and bailey', 'retreats to a modest claim when challenged, then advances the bold one again', 'undercut'),
    ('base-rate', 'Base rate neglect', 'judges a figure without the rate it should be compared with', 'undermine'),
    ('survivorship', 'Survivorship bias', 'counts only the cases that made it through a filter', 'undermine'),
]


def types():
    """Every post type as a dict, the families' own types first, then one per scheme and one per fallacy."""
    out = [dict(zip(('id', 'family', 'label', 'target', 'section', 'side', 'moves', 'aif', 'attack', 'schema', 'example'), t)) for t in _T]
    for key, label, gist, cqs in SCHEMES:
        out.append(dict(id=f'scheme.{key}', family='scheme', label=label, target='page', section='argument', side='either',
                        moves='truth', aif='RA', attack='', schema='Claim', example=gist,
                        questions=[dict(q=q, attack=a, files='link.does-not-follow' if a == 'undercut' else 'truth.premise-false') for q, a in cqs]))
    for key, label, what, attack in FALLACIES:
        out.append(dict(id=f'fallacy.{key}', family='fallacy', label=label, target='link' if attack == 'undercut' else 'claim',
                        section='argument', side='disagree', moves='link' if attack == 'undercut' else 'truth', aif='CA',
                        attack=attack, schema='Claim', example=f'This reason {what}.'))
    return out


TYPES = types()
BY_ID = {t['id']: t for t in TYPES}


def as_json(version):
    """The vocabulary as data, for anyone building against it: a program, another site, another AI."""
    return {'version': version, 'about': __doc__.split('\n\n')[0].replace('\n', ' '),
            'families': [dict(id=f, name=n, about=a) for f, n, a in FAMILIES], 'types': TYPES}


# JSON-LD terms. Each maps to schema.org where schema.org has the idea, and to a term of this site's own where it
# does not, so a page's data block can be read by tools that know schema.org and nothing else.
CONTEXT = {
    '@vocab': 'https://schema.org/',
    'ise': 'https://myklob.github.io/ideastockexchange/beliefs/vocab.html#',
    'Belief': 'ise:Belief', 'Row': 'ise:Row',
    'rows': {'@id': 'ise:row', '@container': '@list'},
    'section': 'ise:section', 'side': 'ise:side', 'tag': 'ise:postType',
    'truthScore': 'ise:truthScore', 'beliefScore': 'ise:beliefScore', 'confidence': 'ise:confidence',
    'contribution': 'ise:contribution', 'linkage': 'ise:linkage', 'importance': 'ise:importance', 'uniqueness': 'ise:uniqueness',
    'claim': {'@id': 'ise:claim', '@type': '@id'}, 'topic': {'@id': 'about', '@type': '@id'},
}
