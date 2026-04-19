export interface RagDocument {
  id: string;
  title: string;
  content: string;
  category: "criteria" | "approval" | "rejection" | "attorney" | "policy";
  cfr_reference?: string;
}

export const EB1A_DOCUMENTS: RagDocument[] = [
  // ─── EB1A Criteria Definitions ────────────────────────────────────────────
  {
    id: "criteria-awards",
    title: "EB1A Criterion 1: Nationally or Internationally Recognized Awards",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(i)",
    content: `The first criterion under 8 C.F.R. § 204.5(h)(3)(i) requires evidence of receipt of lesser nationally or internationally recognized prizes or awards for excellence in the field of endeavor. The award must be recognized in the field, not merely a local or regional honor. USCIS adjudicators look for documentation such as award certificates, press releases announcing the award, and evidence that the award is granted selectively. Multiple awards strengthen this criterion significantly. National awards from professional associations, government agencies, or well-known industry bodies carry the most weight. Awards like NSF CAREER grants, IEEE/ACM fellowships, Fulbright scholarships, or industry-specific honors from Fortune 500 companies satisfy this criterion. Participation awards and certificates of completion do not meet this standard. The award should demonstrate that the petitioner was selected from a competitive pool of candidates.`,
  },
  {
    id: "criteria-memberships",
    title: "EB1A Criterion 2: Membership in Associations Requiring Outstanding Achievements",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(ii)",
    content: `Under 8 C.F.R. § 204.5(h)(3)(ii), the petitioner must show membership in associations in the field which require outstanding achievements of their members, as judged by recognized national or international experts. Standard professional memberships that are open to all practitioners do not satisfy this criterion. Examples of qualifying memberships include: Fellow of IEEE (Institute of Electrical and Electronics Engineers), Fellow of ACM (Association for Computing Machinery), Fellow of the American Physical Society, Fellow of the American Association for the Advancement of Science (AAAS), Royal Society Fellow, or National Academy of Sciences membership. The key is that the membership must require extraordinary achievement as a prerequisite for admission, not just years of experience or payment of dues. USCIS will examine the membership criteria carefully.`,
  },
  {
    id: "criteria-media",
    title: "EB1A Criterion 3: Published Material About the Applicant in Major Media",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(iii)",
    content: `The media criterion under 8 C.F.R. § 204.5(h)(3)(iii) requires published material about the person in professional or major trade publications or other major media, relating to the alien's work in the field. The published material must be about the individual, not merely mentioning them in passing. Qualifying evidence includes: news articles, magazine features, podcast features in major industry publications, television coverage, or newspaper profiles. Publications like Nature, Science, MIT Technology Review, Forbes, TechCrunch, Wired, or major national newspapers satisfy this criterion. Blog posts on personal websites or minor websites do not qualify. The petitioner should provide copies of the articles with translations if necessary, circulation data for the publication, and evidence of the publication's prestige in the field.`,
  },
  {
    id: "criteria-judging",
    title: "EB1A Criterion 4: Participation as a Judge of Others' Work",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(iv)",
    content: `Under 8 C.F.R. § 204.5(h)(3)(iv), the petitioner must demonstrate participation, either individually or on a panel, as a judge of the work of others in the same or an allied field of specialization. This is one of the more easily documentable criteria. Evidence includes: peer review letters from journal editors confirming the applicant reviewed manuscripts; conference program committee membership records; grant review panel participation (e.g., NSF, NIH review panels); doctoral thesis committee membership; judging at recognized competitions; or editorial board membership for academic journals. The key is that the judging must be for work in the petitioner's field. A single peer review may not be sufficient; multiple instances across different venues strengthen the claim significantly. Documentation should include invitation letters from editors or conference chairs.`,
  },
  {
    id: "criteria-contributions",
    title: "EB1A Criterion 5: Original Contributions of Major Significance",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(v)",
    content: `Under 8 C.F.R. § 204.5(h)(3)(v), the petitioner must show evidence of original scientific, scholarly, artistic, athletic, or business-related contributions of major significance in the field. This is one of the hardest criteria to satisfy but also one of the most impactful. Evidence of major significance includes: patents that have been licensed or commercialized; algorithms or frameworks widely adopted by the industry; research that has been cited hundreds or thousands of times; open-source software with significant adoption (thousands of GitHub stars, major company usage); business methods or products that transformed an industry. Simply having patents or publications is insufficient — the contributions must have had demonstrable impact. Expert letters from independent authorities who can attest to the significance of the contributions are critical. Google Scholar citation counts, GitHub metrics, and licensing agreements all serve as objective evidence.`,
  },
  {
    id: "criteria-authorship",
    title: "EB1A Criterion 6: Authorship of Scholarly Articles",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(vi)",
    content: `The authorship criterion under 8 C.F.R. § 204.5(h)(3)(vi) requires evidence of the alien's authorship of scholarly articles in the field, in professional or major trade publications or other major media. Qualifying evidence includes publications in peer-reviewed journals such as Nature, Science, IEEE Transactions, ACM publications, NeurIPS, ICML, CVPR, ICCV, or other top-tier conferences and journals. Books published by academic presses, book chapters in edited volumes, and survey articles in prestigious publications also qualify. The number and prestige of publications matters: a single highly cited paper in a top venue is stronger than many papers in obscure journals. Citation metrics (h-index, i10-index, total citations) should be included. First-author publications carry more weight than co-authored works with many contributors.`,
  },
  {
    id: "criteria-critical-role",
    title: "EB1A Criterion 7: Critical or Essential Role for Distinguished Organizations",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(viii)",
    content: `Under 8 C.F.R. § 204.5(h)(3)(viii), the petitioner must show performance in a leading or critical role for organizations or establishments that have a distinguished reputation. The role must be leading or critical — not simply any role at a distinguished company. A lead engineer, principal scientist, CTO, VP, or Director role at a company like Google, Microsoft, Apple, Amazon, Meta, Netflix, or a leading research institution satisfies this criterion. The organization must have a distinguished reputation in the field. Evidence includes: official employment letters describing the critical nature of the role; organizational charts showing the petitioner's position; evidence of the organization's distinguished reputation (Fortune rankings, industry awards, market capitalization); and documentation of major projects or products the petitioner led.`,
  },
  {
    id: "criteria-high-salary",
    title: "EB1A Criterion 8: High Salary Relative to Others in the Field",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(ix)",
    content: `Under 8 C.F.R. § 204.5(h)(3)(ix), the petitioner must demonstrate that they command a high salary or other remuneration for services in relation to others in the field. The salary should be in the top 10-15% for the occupation and geographic area. Evidence includes: offer letters, pay stubs, W-2 forms, or employer letters confirming compensation; Bureau of Labor Statistics OES survey data or similar surveys showing the 90th percentile wage for the occupation; and Levels.fyi, Glassdoor, or LinkedIn Salary data for comparison. Total compensation including bonuses and equity should be considered. A software engineer at a major tech company earning $300K-$500K+ total compensation clearly satisfies this criterion when compared to median industry wages. The petitioner should proactively compare their compensation to published wage surveys.`,
  },
  {
    id: "criteria-exhibitions",
    title: "EB1A Criterion 9: Display at Artistic Exhibitions",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(vii)",
    content: `Under 8 C.F.R. § 204.5(h)(3)(vii), evidence of the display of the alien's work in the field at artistic exhibitions or showcases may be used. This criterion is most relevant for artists, designers, architects, and creative professionals. Evidence includes: invitations to exhibit at prestigious galleries, museums, or design shows; programs from exhibitions; reviews of the exhibitions in art or design publications; and documentation of the exhibition venue's prestige. For technology professionals, this criterion can apply to featured demonstrations at major conferences (CES, SXSW, major tech summits), or innovative product showcases. Exhibition at nationally recognized venues carries significantly more weight than local or regional showcases.`,
  },
  {
    id: "criteria-commercial-success",
    title: "EB1A Criterion 10: Commercial Success in the Performing Arts",
    category: "criteria",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)(x)",
    content: `Under 8 C.F.R. § 204.5(h)(3)(x), evidence of commercial successes in the performing arts, as shown by box office receipts or record, cassette, compact disk, or video sales. This criterion applies primarily to performing artists, musicians, filmmakers, and entertainers. Box office data, album sales, streaming numbers, and similar metrics serve as objective evidence. For digital creators, metrics such as YouTube subscriber counts in the millions, major brand collaborations, and significant streaming revenue can be considered analogous evidence. The commercial success must be in the performing arts context; business revenue from technology companies would more properly fall under the high salary or critical role criteria.`,
  },

  // ─── Policy Guidance ──────────────────────────────────────────────────────
  {
    id: "policy-three-criteria",
    title: "EB1A Three-Criterion Minimum and Final Merits Determination",
    category: "policy",
    cfr_reference: "8 C.F.R. § 204.5(h)(3)",
    content: `The EB1A petition requires the petitioner to meet at least three of the ten regulatory criteria under 8 C.F.R. § 204.5(h)(3). Meeting three criteria is necessary but not sufficient — the adjudicator then conducts a Final Merits Determination (FMD) to assess whether the totality of the evidence establishes that the petitioner is among the small percentage of individuals who have risen to the very top of their field. This two-step analysis was established in Kazarian v. USCIS (9th Cir. 2010). USCIS first counts the criteria met, then evaluates whether the evidence as a whole demonstrates extraordinary ability. Meeting the minimum three criteria does not guarantee approval. Petitioners near the borderline (3-4 criteria) should bolster each criterion with multiple pieces of evidence and obtain strong expert recommendation letters to survive the FMD.`,
  },
  {
    id: "policy-sustained-acclaim",
    title: "EB1A Sustained National or International Acclaim Requirement",
    category: "policy",
    content: `Beyond meeting specific criteria, the EB1A statute requires sustained national or international acclaim (INA § 203(b)(1)(A)). Sustained means the acclaim must be ongoing, not a brief period of recognition followed by inactivity. Adjudicators look for a consistent record of achievement over multiple years. A single extraordinary achievement, even a very significant one, may not satisfy the sustained component. The petitioner should demonstrate a career trajectory that shows continued recognition, evolving contributions, and ongoing engagement in the field. Recent publications, current advisory roles, ongoing judging activities, and continuing media coverage all support the sustained acclaim argument.`,
  },
  {
    id: "policy-rfe-overview",
    title: "Common EB1A RFE (Request for Evidence) Triggers",
    category: "policy",
    content: `USCIS frequently issues Requests for Evidence (RFEs) in EB1A cases when the initial petition lacks sufficient documentation. The most common RFE triggers include: (1) Assertions of meeting criteria without adequate documentation; (2) Awards that are not clearly nationally or internationally recognized; (3) High citation counts without expert letters explaining the significance; (4) Peer review activities that appear routine rather than selective; (5) Employment at well-known companies without evidence that the role was critical; (6) Publications in conferences or journals without evidence of selectivity or prestige. An RFE is not a denial — it is an opportunity to submit additional evidence. Responding to an RFE comprehensively, with expert affidavits and contemporaneous documentation, often leads to approval.`,
  },

  // ─── Approval Patterns ────────────────────────────────────────────────────
  {
    id: "approval-ai-researcher",
    title: "Approval Pattern: Senior AI Researcher with Publications and High Citations",
    category: "approval",
    content: `A senior AI researcher at a leading technology company was approved for EB1A based on the following evidence profile: (1) 50+ peer-reviewed publications in top venues including NeurIPS, ICML, and ICLR; (2) H-index of 20+ with over 3,000 total citations; (3) Service as area chair or program committee member for 5+ major AI conferences; (4) Named as a key inventor on 3 granted patents; (5) Total compensation in the 95th percentile for ML engineers nationally; (6) Expert letters from four independent professors at leading universities attesting to the significance of contributions. The petition met criteria: authorship (vi), judging (iv), original contributions (v), high salary (ix), and leading role (viii). The final merits determination focused on the expert letters explaining the broad impact of the research on the field.`,
  },
  {
    id: "approval-biotech",
    title: "Approval Pattern: Biotech Scientist with Multiple Awards and Peer Review",
    category: "approval",
    content: `A biotech scientist was approved for EB1A after initially receiving an RFE. The approved petition documented: (1) Receipt of an NIH Career Development Award (K99/R00), a nationally competitive award; (2) Membership as an elected Fellow of the American Society for Microbiology (requiring peer nomination); (3) 25 peer-reviewed publications including first-author papers in Nature Biotechnology and Cell; (4) Served as grant reviewer for NIH study sections on three occasions; (5) Expert letters from six leading scientists in the field. The RFE had questioned whether the initial award evidence met the nationally recognized standard. The response included detailed documentation of the award's selection process and acceptance rate (under 5%), which satisfied USCIS.`,
  },
  {
    id: "approval-software-entrepreneur",
    title: "Approval Pattern: Software Entrepreneur with Commercial Success and Media",
    category: "approval",
    content: `A software entrepreneur and founder was approved for EB1A based on: (1) Founding a company that grew to $50M ARR, with media coverage in TechCrunch, Forbes, and Wired; (2) A critical role as CTO of a Series B startup with 200+ employees; (3) Invented and patented a novel algorithm that was licensed by three Fortune 500 companies; (4) Regular speaking invitations at major tech conferences (AWS re:Invent, Google I/O developer summits); (5) Open-source contributions with a framework exceeding 15,000 GitHub stars and adoption by major enterprises. The petition successfully argued original contributions of major significance through the licensing agreements and expert testimony from industry leaders who had adopted the technology.`,
  },
  {
    id: "approval-doctor-medicine",
    title: "Approval Pattern: Physician-Scientist with Research and Clinical Leadership",
    category: "approval",
    content: `A physician-scientist was approved for EB1A with evidence including: (1) Research leading to FDA-approved clinical protocol, representing a landmark original contribution; (2) Publication of 30+ peer-reviewed articles with over 2,000 total citations; (3) Invited as keynote speaker at five major international medical conferences; (4) Board membership on the editorial committees of three peer-reviewed journals; (5) Receipt of the Young Investigator Award from a major specialty medical society; (6) Salary in the top 5% nationally for physicians in the specialty. Seven expert letters from department chairs and international experts confirmed the significance of clinical contributions. The approving officer specifically noted the FDA approval as exceptional evidence of original contributions of major significance.`,
  },

  // ─── Rejection Patterns ───────────────────────────────────────────────────
  {
    id: "rejection-insufficient-criteria",
    title: "Rejection Pattern: Fewer Than Three Criteria Documented",
    category: "rejection",
    content: `EB1A petitions are denied when fewer than three criteria are established with sufficient evidence. Common scenarios leading to denial include: (1) Listing awards that are local, company-internal, or employee recognition programs rather than nationally competitive honors; (2) Claiming membership in professional associations open to any practitioner without demonstrating that the association requires outstanding achievement; (3) Listing publications without evidence of the publication's prestige or selectivity; (4) Claiming a leading role without documenting that the organization has a distinguished reputation or that the role was critical rather than routine. The petitioner must not only claim criteria but must prove each criterion with contemporaneous primary documentation. Self-serving statements without corroboration are insufficient.`,
  },
  {
    id: "rejection-final-merits",
    title: "Rejection Pattern: Three Criteria Met but Failed Final Merits Determination",
    category: "rejection",
    content: `Even when three criteria are documented, USCIS may deny the petition if the Final Merits Determination concludes the evidence does not establish that the petitioner is among the small percentage at the very top of the field. Common failure points in the final merits analysis: (1) Expert letters that are generic, from supervisors or colleagues rather than independent authorities, or that fail to explain why the work is extraordinary rather than excellent; (2) Citation counts that are respectable but not exceptional for the field; (3) Awards that meet the regulatory definition technically but are not highly selective; (4) No evidence that the petitioner's work has influenced others in the field through citations, adoptions, or follow-on work; (5) A career trajectory that shows solid competence but not extraordinary acclaim. The key question is: Would a knowledgeable expert in the field immediately recognize this person as extraordinary?`,
  },
  {
    id: "rejection-documentation",
    title: "Rejection Pattern: Adequate Claims but Inadequate Documentation",
    category: "rejection",
    content: `A recurring denial pattern occurs when petitioners have genuine extraordinary ability but submit inadequate documentation. Specific documentation failures include: (1) Failing to submit translated copies of foreign-language publications or awards; (2) Not providing evidence of award selectivity (selection rate, judging criteria, number of applicants); (3) Peer review evidence consisting only of a single letter from one journal, rather than multiple instances across different venues; (4) Employment letters that describe responsibilities but not the critical nature of the role or the organization's distinguished status; (5) Salary evidence without comparison data showing the salary is in the top tier nationally. An experienced immigration attorney reviews not just the substance of the claim but ensures that each piece of evidence is appropriately formatted, translated, and supported with corroborating context.`,
  },

  // ─── Attorney Argument Templates ──────────────────────────────────────────
  {
    id: "attorney-expert-letters",
    title: "Attorney Strategy: Crafting Effective Expert Recommendation Letters",
    category: "attorney",
    content: `Expert recommendation letters are often the deciding factor in EB1A petitions, particularly for the Final Merits Determination. Effective expert letters: (1) Come from independent experts — not supervisors, colleagues, or professional collaborators — who can objectively assess the petitioner's standing in the field; (2) Explain the expert's own qualifications and why they are competent to assess the petitioner; (3) Describe the specific contributions of the petitioner with technical detail that a non-expert adjudicator can understand; (4) Compare the petitioner to others in the field, explaining what places them in the top tier; (5) Describe the impact of the petitioner's work on the field, including downstream work it enabled or industry adoption; (6) Reference specific publications, patents, projects, or achievements by name. Aim for 6-8 expert letters, with at least 4 from experts who have no prior professional relationship with the petitioner.`,
  },
  {
    id: "attorney-citation-strategy",
    title: "Attorney Strategy: Maximizing the Impact of Citation Evidence",
    category: "attorney",
    content: `Citation evidence can satisfy both the authorship criterion and support the original contributions criterion, but it must be presented strategically. Effective citation presentation includes: (1) Printing a full Google Scholar profile showing total citations, h-index, and i10-index; (2) Identifying the most-cited papers and explaining their significance in a cover letter; (3) Providing examples of papers that cite the petitioner's work, highlighting when major research groups or industry applications build on the work; (4) Including expert letters that contextualizes the citation numbers relative to field norms (citations in mathematics are lower than in computer science, for example); (5) If self-citations are significant, a breakdown of citations excluding self-citations adds credibility. Citation counts in the top 1-5% for the field, as confirmed by expert testimony, strongly support both scholarly authorship and original contributions.`,
  },
  {
    id: "attorney-totality-argument",
    title: "Attorney Strategy: Building the Totality of Evidence Narrative",
    category: "attorney",
    content: `The Final Merits Determination requires the petitioner to demonstrate that, taken as a whole, the evidence establishes extraordinary ability. The attorney's narrative brief is critical. An effective totality argument: (1) Opens with a clear statement of the petitioner's extraordinary status and specific field position; (2) Describes the field itself and the competitive landscape, establishing what it means to be extraordinary in this field; (3) Walks through each criterion with cross-referencing — showing how the award, the citations, and the expert letters all reinforce each other; (4) Addresses potential weaknesses proactively, explaining why apparent gaps do not undermine the overall extraordinary ability showing; (5) Concludes with a comparative analysis showing that the petitioner's qualifications exceed those of comparable approved cases; (6) References precedent decisions (AAO non-precedent decisions available through FOIA) for similar profiles that were approved. The narrative transforms individual pieces of evidence into a coherent story of extraordinary achievement.`,
  },
];

export function getAllDocuments(): RagDocument[] {
  return EB1A_DOCUMENTS;
}
