Table of Contents:



# Well Supported Conclusion Promoting Algorithm #

We are drowning in data, information, and arguments. Because of the complexity of the issues we face, we need to harness big data to help us make better conclusions.

We must set up a database that allows us to map out how conclusions are related to other conclusions and how beliefs are or strengthened and weakened by different assumptions. Creating this database will allow us to gives scores to conclusions based on the collective scores of their assumptions. Once a belief’s score is tied into the score of its assumptions, you can harness computer power to automatically update all the scores that are built on a single assumption, when that assumption is strengthened or weakened.

Creating this database will allow us to finally use the information at our fingertips to make a better world.

I propose building database tools that will allow us to implement this simple formula:

A particular Conclusion's Score = ∑(Score of arguments that Agree-Score of arguments that Disagree)×LinkageScore×Unique Score)

Or abbreviating:
C=∑(A-D)×L×U

The “linkage” score will be required, because when someone tries to say that one argument can be used to support another conclusion, we will need a way to define (on a scale from -100% to 100%) if the argument is related can truly be said to support the conclusion.

The “Unique” score will be required, because there are many different ways of saying the same thing. When people start tagging groups of text (a few sentences long) as arguments, there will be a lot of duplication. Therefore for each argument, there will be ways of assigning if a particular argument is unique (on a scale from 0 to 100%). For instance, there will be a place to suggest “better ways of saying the same thing” for each argument, and linking to the proposed better argument.

I have been developing how we can optimize this database since sense 1998, but I don’t want to go into all that detail, because it is a very simple idea, that I believe can vastly improve the way we come to conclusions, and make arguments.


## SQL Project Description ##
Basically it is a family tree database with these differences:
  * Parents are replaced by arguments and
  * children are replaced by conclusion, in such a way that multiple arguments (parents) are combined to support a conclusion (child).
  * Multiple arguments are organized to support conclusions, but we will add arguments that also link to conclusion, but they will go into a table of reasons that disagree with the conclusion. So just as some parents are tagged as "male" and some parents are tagged as "female" some arguments will be tagged as reasons to agree, and some will be tagged as reasons to disagree.
  * We will use the listed formulas to count the number of reasons that agree and subtract the number of reasons that disagree (ancestors)

This is an open source family tree website, that we could use as a starting place:

http://gitorious.org/opengb#more

# Why we should use SQL/PHP databases to count the reasons to agree and disagree with a conclusion #

How do you define a good conclusion? It is simple: a good conclusion has lots of good arguments that support it, and not very many good arguments that oppose it. But how do you know if an argument is any good? Well of course [the turtle stack goes all the way down](http://en.wikipedia.org/wiki/Turtles_all_the_way_down): good arguments have lots of good reasons to agree with them, and not very many good reasons to disagree with them.

(For example, as you can see below, the conclusion in red has two reasons to support it, and one reason to disagree with it. The first reason to agree with the conclusion also has a reason to agree with it, and a reason to disagree with it.  So the conclusion in essence has 3 reasons to agree with (shown in black) and 2 reason to disagree with it (in blue and green).

Diagram #1: Arguments support conclusions. Other arguments support them. ![http://2.bp.blogspot.com/-CPipmC5wYkM/UMtHAgn-oCI/AAAAAAAAmjI/h9j7L5dZzIo/s310/Argument%2BStructure.png](http://2.bp.blogspot.com/-CPipmC5wYkM/UMtHAgn-oCI/AAAAAAAAmjI/h9j7L5dZzIo/s310/Argument%2BStructure.png)

So if we build a debate forum, in which people enter their arguments in a structured way, we could gather the data necessarily to count the relative number of reasons to agree or disagree with each conclusion. Luckily people love to debate. People will debate who the hottest supermodel is, and won't shut up about who is going to win the Superbowl. Of course we could just wait and find out, but opinions are like elbows, everyone has them. With the world wide population approaching 7 billion, if we have a good forum, it shouldn't be too hard to get a few hundreds of people enter data.

I propose that we build the SQL/PHP code that would facilitate an online forum. This forum would use a relational database to track reasons to agree and disagree with conclusions. It would also allow you to submit a belief as a reason to support another belief (see the image above):

Arguments are currently made on websites, in books, and even in videos and songs. It would be powerful to outline all the arguments that agree or disagree with a conclusion and put them on the same page. The best way to do this, is with a relational database, as seen below:

![http://3.bp.blogspot.com/-RmpcS93wFPo/UMtcXEp5R7I/AAAAAAAAmkg/AXOs_VRRsak/s1600/Picture%2Bexplanation%2Bof%2Bthe%2Bdatabase.jpg](http://3.bp.blogspot.com/-RmpcS93wFPo/UMtcXEp5R7I/AAAAAAAAmkg/AXOs_VRRsak/s1600/Picture%2Bexplanation%2Bof%2Bthe%2Bdatabase.jpg)

Having the structure of how all these arguments are used to support each other, could allow us to automatically strengthen or weaken a conclusion's score based on the score of their assumptions.

The purpose of the Idea Stock Exchange (this site) is to find ways to give conclusions scores based on the quality and quantity of reasons to agree or disagree with them with an open sourced SQL database.

## Pros and Cons are a tried and true method to evaluate a conclusion ##

Many people, including Thomas Jefferson and Benjamin Franklin advocated making a list of pros and cons, to help them make decisions. The assumption is that the quantity and quality of the reasons to agree or disagree with a proposed conclusion has some bearing as to underlining strength of that conclusion. I wholeheartedly agree.

## No one has yet harnessed the power of Pros and Cons in the information age, we can ##

However, now that we have the internet, we can crowd source the brainstorming of reasons to agree or disagree with a conclusion.

The only trick is how do you evaluate the strength of each pro or con? Many people suggest putting the strongest pros or cons at the top of the list. Also, if we had enough time we might make a separate list FOR each pro or con.

For instance, FDR had to decide if we should join WWII or not. One pro might be that the German leaders were bad. There were many reasons to support this belief, and this belief was used to support another belief.

Not very many people have enough time to do a pro or con list for each pro or con. But on the internet we keep making the same arguments over and over again. For thousands of years we have been repeating the same arguments that Aristotle and Homer have made. Most of our arguments have been made thousands or millions of times. However no one has ever taken the time to put them into a database, and outline how they relate to each other. We can change this.

# Examples #

We might be arguing the conclusion that “It was good for us to join WWII.” Someone may submit the argument that “Nazis were doing bad things” as a reason to support the conclusion about entering the war. The belief that Nazis were doing bad things might already have a score. Let’s suppose that this idea score has a high ranking of 99%. This might be awarded a linkage score of 90% (as a reason to support the conclusion that we should have gone to WWII).  In this situation it would contribute 0.495 points (0.99 X 0.5) to the conclusion score for the beliefs that “It was good for us to join WWII”. Someone else might submit a belief that “Nazis were submitting wide scale systematic genocide” as a reason to support the belief that “It was good for us to go to WWII”. Because we don’t go to war with every country that “does bad things”, we would assume that this linkage score would be higher, perhaps a 98%.

For example the belief that Nazi Germany leaders were evil, is a belief with many argument to support it. However it can also be used as an argument to support other conclusions, such as the belief that it was good of us to join WWII.

# Additional Information #

  * [Other Algorithms that could be used to promote good conclusions](OtherAlgorithms.md)

[Here is my attempt in MS Access](https://drive.google.com/file/d/0B1YFAV_d4jtJLUFrdjBzbkhVTXM/edit?usp=sharing)

