Traditional web search results rely on Google's PageRank algorithm, which measures the number of links to a website to determine its quality. However, this method can be manipulated and influenced by propaganda. ReasonRank, an adaptation of Google's PageRank Algorithm, addresses these limitations by evaluating the strength and validity of individual arguments within a pro/con forum.

ReasonRank adjusts the algorithm to count both the quantity and quality of reasons to agree or disagree, along with their corresponding sub-arguments. This allows for more persuasive arguments to be assigned greater importance, similar to how PageRank assesses the quality of links by the number and quality of links to their sub-links.

We can use ReasonRank to evaluate specialized pro-con arguments that address whether an argument would necessarily strengthen or weaken the conclusion, as well as if an argument is verified, logically sound, or significant.

Using ReasonRank in a pro/con forum would be an effective way to evaluate the strength and impact of individual arguments, ensuring evaluations are objective, transparent, and reliable. To further enhance the process, user feedback (votes) can be incorporated to refine the scores over time and ensure the strongest arguments rise to the top.

ReasonRank, in combination with user feedback and open discussion, has the potential to revolutionize the way we evaluate arguments and make decisions.

# Variables Need to Program Reason Rank: 
The reason_rank function takes a number of arguments, including:

Below are a list of variables:
1. M (M_pro and M_con): The adjacency matrix for arguments where M[i, j] represents the link from argument j to argument i for pro and con arguments, respectively. The adjacency matrix is a fundamental concept in graph theory, which is also used in Google's PageRank algorithm.
2. M_linkage_Pro and M_Linkage_Con: The adjacency matrices for argument-to-conclusion linkage, where M_linkage_Pro[i, j] and M_linkage_Con[i, j] represent the link from linkage argument j to pro or con argument i, respectively.  These matrices help determine how strongly each argument is connected to the overall conclusion.
3. uniqueness_scores_Pro and uniqueness_Scores_con: A vector containing the uniqueness scores for arguments.
4. initial_scores_Pro and initial_scores_con: A vector containing the initial scores for arguments.
5. num_iterations: The number of iterations for the algorithm to run (default is 100, but we can have a separate pro/con argument that it should be different and track its score).
6. d: The damping factor, a float value between 0 and 1 (default is 0.85).
7. N: The number of main arguments (separate for pro and con arguments).
8. v: A vector containing the argument scores at a specific iteration (separate for pro, con, and linkage arguments).
9. M_hat: The modified adjacency matrix for arguments, which includes the damping factor (separate for pro, con, and linkage arguments).
10. adjusted_v: The final adjusted argument scores, considering the linkage and uniqueness scores (separate for pro and con arguments). 

# Code

Sample Code: 

````python
import numpy as np

def reason_rank(M_pro, M_con, M_linkage_pro, M_linkage_con, uniqueness_scores_pro, uniqueness_scores_con, initial_scores_pro, initial_scores_con, num_iterations=100, d=0.85):
    
    N_pro = len(initial_scores_pro)
    N_con = len(initial_scores_con)
    
    v_pro = initial_scores_pro.copy()
    v_con = initial_scores_con.copy()
    
    M_hat_pro = d * M_pro + (1 - d) / N_pro * np.ones((N_pro, N_pro))
    M_hat_con = d * M_con + (1 - d) / N_con * np.ones((N_con, N_con))

    M_hat_linkage_pro = d * M_linkage_pro + (1 - d) / N_pro * np.ones((N_pro, N_pro))
    M_hat_linkage_con = d * M_linkage_con + (1 - d) / N_con * np.ones((N_con, N_con))
    
    for _ in range(num_iterations):
        v_pro = M_hat_pro @ v_pro
        v_con = M_hat_con @ v_con

        v_linkage_pro = M_hat_linkage_pro @ v_pro
        v_linkage_con = M_hat_linkage_con @ v_con

    adjusted_v_pro = v_pro * uniqueness_scores_pro * v_linkage_pro
    adjusted_v_con = v_con * uniqueness_scores_con * v_linkage_con

    return adjusted_v_pro, adjusted_v_con

# Example usage
# Replace these example matrices and vectors with your actual data
M_pro = np.array([[0, 1], [1, 0]])
M_con = np.array([[0, 1], [1, 0]])
M_linkage_pro = np.array([[1, 0], [0, 1]])
M_linkage_con = np.array([[1, 0], [0, 1]])
uniqueness_scores_pro = np.array([1, 1])
uniqueness_scores_con = np.array([1, 1])
initial_scores_pro = np.array([1, 1])
initial_scores_con = np.array([1, 1])

adjusted_v_pro, adjusted_v_con = reason_rank(M_pro, M_con, M_linkage_pro, M_linkage_con, uniqueness_scores_pro, uniqueness_scores_con, initial_scores_pro, initial_scores_con)

print("Adjusted Pro Argument Scores: ", adjusted_v_pro)
print("Adjusted Con Argument Scores: ", adjusted_v_con)
````


# Explanation

Variable Development

The function starts by calculating the modified adjacency matrices, M_hat_pro and M_hat_con, which are used to compute the scores of the arguments at each iteration of the algorithm. The modified adjacency matrices are calculated using the following formula:
M_hat = d * M + (1 - d) / N * I

where:

* M is the adjacency matrix.
* d is the damping factor.
* N is the number of arguments.
* I is the identity matrix.

The function then iterates for the specified number of iterations, num_iterations. At each iteration, the scores of the arguments are updated as follows:
v = M_hat @ v

where:
* v is the vector of argument scores.
* M_hat is the modified adjacency matrix.

Finally, the function returns the adjusted argument scores, calculated as:

adjusted_v = v * uniqueness_scores * v_linkage

where:
adjusted_v is the vector of adjusted argument scores.

v is the vector of argument scores.

uniqueness_scores is a vector containing the uniqueness scores for arguments.

v_linkage is a vector containing the linkage scores for arguments.

The example usage shows how to use the reason_rank function to calculate the adjusted argument scores for a set of pro and con arguments. The example code uses the following data:

M_pro = np.array([[0, 1], [1, 0]])
M_con = np.array([[0, 1], [1, 0]])
M_linkage_pro = np.array([[1, 0], [0, 1]])
M_linkage_con = np.array([[1, 0], [0, 1]])
uniqueness_scores_pro = np.array([1, 1])
uniqueness_scores_con = np.array([1, 1])
initial_scores_pro = np.array([1, 1])
initial_scores_con = np.array([1, 1])

The output of the example code is:
Adjusted Pro Argument Scores: [1.0, 1.0]
Adjusted Con Argument Scores: [1.0, 1.0]
