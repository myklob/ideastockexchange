{{{<!ELEMENT Belief (Heading?, FIRSTAUTHOR?, FIRSTDate?, Submitter?, Catigory?, EvidenceType?, Conclusion Score, Evidence to Conclusion Score, num R2A?, numR2D?, score?)>

<!ELEMENT Belief (#PCDATA)        --Statement of Belief or Evidence, Text max 50 words-->

<!ELEMENT Heading (#PCDATA)       --Or Topic, max 10 words Brief summary of belief not required-->

<!ELEMENT FIRSTAUTHOR (#PCDATA)  --IE Plato. The first person who stated the belief-->

<!ELEMENT FIRSTDate (Year,Month,Day)  --ie 1932. The date of the first person to be recorded as stating the belief-->


<!ELEMENT	DateCreated (Year,Month,Day)>

<!ELEMENT	DateRevised (Year,Month,Day)>

<!ELEMENT	Day (#PCDATA)>

<!ELEMENT Submitter (#PCDATA)  --ie Name or User ID-->

<!ELEMENT Catigory (#PCDATA)  --ie Arts and Literature, from a predefined list-->

<!ELEMENT EvidencePolarity (Pro | Con)>

<!ELEMENT EvidenceType (Logical Argument, Book, Webpage, Article) --I'm not sure how to do this. I want the "evidence" to be either one of the other beliefs, or books, webpages, scientific studies, or other catigories to be named latter. So Logical Argument is equal to Belief... For example the belief that guns are dangerious is a belief, that has reasons to agree or disagree. It also has books, and webpages that agree and disagree. But it is also a reason to support or oppose other conclusions. For instance the validity of gun control measures. So if you strengthen or weaken the belief that guns are dangerous, it should automatically strengthen or weaken gun control arguments. That is why I would like one argument to be used as a reason to support another argument, but I'm not sure how to do it-->
<!ELEMENT Proposition(Antecedent, Consequent) --I need to work out the correct format for this... I want to select an item from the above "EvidenceType", and define it as an antecedent with a relationship to a consequent. An antecedent is the first half of a hypothetical proposition. For example, if P, then Q. -->


--I need to have a way of identifying all the evidence to support or oppose a conclusion. I don't know if there is any way to define this in a DTD. Obviously at some point there will be a report for each belief, reasons to agree and disagree. Perhaps you would want to limit the number of reasons to agree with a conclusion to 7 or 20. Please help!--


--All the interesting groundbreaking new stuff is above... now I just need to re-use other standards for entering the below arguments. I really do think it would be groundbreaking for this class to create a Standard XLM format for exchanging arguments structures. We have plenty of data, but we need to put our data into context, and back our conclusions up with clear logic. I can't think of a better use for databases, but to help us organize our thoughts, our beliefs, and ultimatly make better decisions.--


<!ELEMENT Book (Title, Authors, Remark?) --some books can be said to support or oppose different conclusions.-->
<!ATTLIST Book ISBN CDATA #REQUIRED
Edition CDATA #IMPLIED --Not sure why this is included in the same line as above-->
<!ELEMENT Magazine (Title)>
<!ATTLIST Magazine Month CDATA #REQUIRED Year CDATA #REQUIRED>
<!ELEMENT Title (#PCDATA)>
<!ELEMENT Authors (Author+)>
<!ELEMENT Remark (#PCDATA)>
<!ELEMENT Author (First\_Name, Last\_Name)>
<!ELEMENT First\_Name (#PCDATA)>
<!ELEMENT Last\_Name (#PCDATA)>

<!ELEMENT Webpage (Name?, URL)>
<!ELEMENT name (#PCDATA)>
<!ELEMENT url (#PCDATA)>

<!ELEMENT	Article (Journal,ArticleTitle,((Pagination, ELocationID**) |
> ELocationID+),Abstract?, Affiliation?, AuthorList?,
> Language+, DataBankList?, GrantList?,PublicationTypeList,
> VernacularTitle?, ArticleDate**)>
<!ATTLIST	Article
> PubModel (Print | Print-Electronic | Electronic |
> > Electronic-Print) #REQUIRED>
<!ELEMENT	ArticleDate (Year,Month,Day)>
<!ATTLIST	ArticleDate DateType CDATA  #FIXED "Electronic">
<!ELEMENT	ArticleTitle (#PCDATA)>
<!ELEMENT	Author (((LastName, ForeName?, Initials?, Suffix?) |
> > CollectiveName),Identifier**)>
<!ATTLIST	Author ValidYN (Y | N) "Y">
<!ELEMENT	AuthorList (Author+)>
<!ATTLIST	AuthorList CompleteYN (Y | N) "Y">**

<!ELEMENT	Abstract (AbstractText+,CopyrightInformation?)>
<!ELEMENT	AbstractText (#PCDATA)>
<!ATTLIST       AbstractText

> Label CDATA #IMPLIED
> NlmCategory (UNLABELLED | BACKGROUND | OBJECTIVE | METHODS |
> > RESULTS | CONCLUSIONS) #IMPLIED>
<!ELEMENT	CopyrightInformation (#PCDATA)>



> (Authors**, Publication Date**, Title)
Type of Scientific Study
Double Blind Scientific Study
Other

Argument Score(ATA (arguments that Agree), ATD (Arguments that Disagree))
> Argument Score1: ATA-ATD
> Argument Score1: (ATA-ATD/(ATA+ATD)
Linkage Score (ID of Belief, Argument ID, RTS (arguments that support Linkage), RTNS (arguments that don't support the linkage)
> Linkage Score 1: RTS-RTNS
> Linkage Score 2: (RTS-RTNS)/(RTS+RTNS)
> > Beliefs the books are said to support (ISBN of the book, IDA, IDD)
User ID                        <--String, -->


> --IDA/D are USER ID of those who Agree/Disagree that a book can be said to support a conclusion
> Calculated Value
> > NAB: Number of people who Agree that a Book can be said to supports a conclusion Count(IDA)
> > NDB: Number of people who Disagree that a Book can be said to supports a conclusion Count(IDD)
> > BTA: Book's total Agreement, NAB-NDB
> > BAR: Book's Agreement Ratio, (NAB-NDB)/(NAB+NDB)

The goal is that people will submit content as reasons to agree or
}}}```