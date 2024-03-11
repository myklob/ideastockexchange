# Idea Stock Exchange: Advancing Automated Conflict Resolution and Cost-Benefit Analysis

Within the Idea Stock Exchange's innovative ecosystem, the Conclusion Score (CS) emerges as a pivotal metric for quantitatively evaluating the strength and validity of conclusions or beliefs. This metric, integral to the platform's automated conflict resolution and cost-benefit analysis capabilities, is meticulously derived from a multi-faceted evaluation of arguments and evidence both supporting and opposing a given conclusion. Here's a synthesis of its components, drawing on the best elements from your documents:

The Idea Stock Exchange uniquely employs the Conclusion Score (CS) as a cornerstone metric for quantitatively evaluating conclusions or beliefs within its framework. This metric, essential for the platform's sophisticated conflict resolution and cost-benefit analysis, synthesizes various facets of argumentation and evidential support. To enhance clarity and comprehension, below is a tabular summary of the CS components, followed by a simplified example calculation:

**Component Summary:**

| Component | Abbreviation | Description |
|-----------|--------------|-------------|
| Reasons to Agree/Disagree | RtA/RtD | The strength and quantity of arguments for or against a conclusion. |
| Evidence Strength | ES | Evaluates the solidity and relevance of supporting or disputing evidence. |
| Logical Coherence | LC | Assesses logical structuring and the absence of fallacies in arguments. |
| Verification and Credibility | VC | Measures evidence support through unbiased and independent sources. |
| Linkage and Relevance | LR | Evaluates the argument's direct influence on and significance to the conclusion. |
| Uniqueness and Distinctiveness | UD | Recognizes the originality and innovation in argumentation, reducing redundancy. |
| Argument Importance | AI | Weighs the argument's significance and potential effect on the conclusion. |

The Conclusion Score (CS) is thus calculated:

# CS=∑((RtA−RtD)×ES×LC×VC×LR×UD×AI)

This formula encapsulates the essence of balanced, evidence-based deliberation, rewarding arguments that are not only well-supported and logically coherent but also unique and pivotal to the conclusion. Through this scoring mechanism, the Idea Stock Exchange facilitates transparent, informed decision-making, empowering users to engage in nuanced discussions that drive towards the most reasoned and evidence-backed conclusions.

In marrying the analytical depth of evidence evaluation with the clarity of logical and ethical reasoning, this refined approach ensures that every argument and piece of evidence contributes meaningfully to the discourse, propelling the Idea Stock Exchange towards its goal of fostering a more informed and participatory democratic process.

**Simplified Example Calculation (Optional):**

Imagine a scenario where a policy's CS is being assessed. For simplicity, let's say there are two reasons to agree (RtA) with scores of 4 and 3, one reason to disagree (RtD) with a score of 2, and the components ES, LC, VC, LR, UD, and AI have averaged weighted values of 0.8, 0.9, 1.0, 0.85, 0.9, and 0.95, respectively. The CS could be roughly calculated as follows:

CS=((4+3−2)×0.8×0.9×1.0×0.85×0.9×0.95)

This approach, while simplified, underscores the comprehensive and nuanced evaluation that every argument undergoes in the Idea Stock Exchange's quest to foster well-reasoned, evidence-based conclusions.

Each item uses ReasonRank to create a score based on the performance of pro/con sub-arguments. Of course, these sub-arguments also have their own reason rank score. 

Here's Python script where the PageRank algorithm is modified to reflect an "ArgumentRank" approach. This modification adds the scores of supporting arguments and evidence and subtracts the scores of weakening arguments and evidence:

# Development
For the IdeaStockExchange, here are suggested substeps for each of the main steps:

### 1. Prototype Completion
- **Design Conceptualization**: Develop a clear concept of the enhanced argument evaluation system, including its scope and key features.
- **Algorithm Development**: Create initial versions of the Logical Fallacy and Evidence Verification algorithms.
- **Interface Design**: Design a user-friendly interface for interacting with the system.
- **Initial Coding**: Start coding the prototype based on the designs and algorithms.
- **Integration**: Combine different components (e.g., database, user interface, algorithms) into a single functioning system.
- **Internal Review**: Conduct an in-house review of the prototype to ensure basic functionality and coherence.

### 2. First Testing Phase
- **Unit Testing**: Test individual components of the system for specific functionalities.
- **Integration Testing**: Ensure that different system components work together seamlessly.
- **Bug Tracking**: Implement a system to identify, track, and resolve bugs.
- **Feature Validation**: Verify that all intended features are operational and meet design specifications.
- **Performance Assessment**: Evaluate the system's performance, including speed and resource usage.
- **Security Checks**: Conduct initial security assessments to identify any vulnerabilities.

### 3. Feedback Review
- **User Testing**: Allow a select group of users to test the system and provide feedback.
- **Survey and Feedback Collection**: Create surveys or feedback forms for structured input.
- **Analysis of Feedback**: Analyze all received feedback for common trends and insights.
- **Prioritization**: Prioritize feedback based on its impact and feasibility.
- **Planning for Revisions**: Plan necessary revisions and enhancements based on feedback.

### 4. Final Algorithm Tuning
- **Algorithm Refinement**: Refine algorithms based on testing results and user feedback.
- **Data Analysis Improvement**: Enhance the system's data analysis capabilities for more accurate results.
- **Optimization for Efficiency**: Optimize algorithms for better performance and efficiency.
- **Accuracy Testing**: Test the revised algorithms for accuracy and reliability.
- **Final Security Enhancement**: Strengthen security measures based on the latest standards.

### 5. Release Candidate
- **Final Integration Testing**: Conduct comprehensive testing of the integrated system.
- **Documentation Completion**: Complete all documentation, including user manuals and technical guides.
- **Quality Assurance Review**: Perform a thorough quality check to ensure system readiness.
- **Stakeholder Approval**: Obtain final approval from key stakeholders.
- **Pre-launch Marketing**: Begin marketing activities to create buzz around the upcoming launch.

### 6. Version 1.0 Launch
- **Deployment Preparation**: Prepare for deployment, including final checks and setup.
- **Launch Event**: Organize a launch event or announcement.
- **Public Release**: Release the system to the public.
- **Monitoring Post-launch**: Monitor the system for any immediate issues post-launch.
- **User Support Setup**: Establish a support system for users to address queries and issues.
- **Continuous Improvement Plan**: Develop a plan for ongoing updates and improvements based on user experience and technological advancements.

Each of these substeps plays a crucial role in systematically bringing the IdeaStockExchange from concept to reality, ensuring its effectiveness and user satisfaction.

```python
import numpy as np

def argumentrank(M, num_iterations: int = 100, d: float = 0.85):
    """ArgumentRank algorithm with explicit number of iterations. Returns ranking of nodes (arguments) in the adjacency matrix.

    Parameters
    ----------
    M : numpy array
        adjacency matrix where M_i,j represents the link from 'j' to 'i', such that for all 'j'
        sum(i, M_i,j) != 0 (due to adding and subtracting)
    num_iterations : int, optional
        number of iterations, by default 100
    d : float, optional
        damping factor, by default 0.85

    Returns
    -------
    numpy array
        a vector of ranks such that v_i is the i-th rank,
        v sums may not equal 1 due to addition and subtraction of arguments

    """
    N = M.shape[1]
    v = np.ones(N) / N
    M_hat = d * M + (1 - d) / N
    for i in range(num_iterations):
        v = np.dot(M_hat, v)
        # Adjustments to ensure scores are not negative and sum to 1 after each iteration
        v = np.maximum(v, 0)
        v /= v.sum()
    return v

# Example adjacency matrix for argument links
M = np.array([[0, -0.5, 0, 0, 1],
              [0.5, 0, -0.5, 0, 0],
              [0.5, -0.5, 0, 0, 0],
              [0, 1, 0.5, 0, -1],
              [0, 0, 0.5, 1, 0]])

v = argumentrank(M, 100, 0.85)
print(v)
```

This edited script represents an "ArgumentRank" algorithm where the adjacency matrix `M` now accounts for both strengthening and weakening arguments. The matrix entries are adjusted to add scores for supporting arguments and subtract scores for weakening arguments. Additionally, after each iteration, the algorithm ensures that the scores are normalized (non-negative and sum to 1) to maintain a consistent ranking system.


## Feedback and Suggestions
Your insights make us better. For any suggestions, ideas, or bug reports related to the Idea Stock Exchange, please utilize our [GitHub issue tracker](/issues).

## License
The Idea Stock Exchange operates under the [MIT License](/LICENSE) - committed to openness and collaborative growth.

## Acknowledgements
We are deeply grateful to all thinkers and contributors to the Idea Stock Exchange. Your dedication to fostering objective, evidence-based, and nuanced discussions is the cornerstone of our community. Together, we're building a platform for intelligent, balanced debate.

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

Here's a blank template to get started: To avoid retyping too much info. Do a search and replace with your text editor for the following: `github_username`, `repo_name`, `twitter_handle`, `linkedin_username`, `email_client`, `email`, `project_title`, `project_description`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started with the Idea Stock Exchange

Welcome to the Idea Stock Exchange! Here's a simple guide to help you set up the project on your local machine for development and testing purposes. Follow these steps to get started.

### Prerequisites

Before you begin, make sure you have the following installed:
- Git (for cloning the repository)
- A preferred text editor or Integrated Development Environment (IDE)
- Required software dependencies (as listed in the project's documentation)

### Installation

1. **Clone the Repository:**
   - Open your terminal (Command Prompt, PowerShell, Terminal, etc.).
   - Navigate to the directory where you want to clone the project.
   - Clone the repository by running: 
     ```
     git clone https://github.com/[Username]/IdeaStockExchange.git
     ```
   - Replace `[Username]` with the appropriate GitHub username or organization name.

2. **Navigate to the Project Directory:**
   - After cloning, move into the project directory by running:
     ```
     cd IdeaStockExchange
     ```

3. **Install Dependencies:**
   - Depending on the project’s nature, you might need to install specific dependencies. This can typically be done using a package manager like `npm` for Node.js projects or `pip` for Python.
   - For example, if it's a Node.js project, run:
     ```
     npm install
     ```

4. **Set Up Environment Variables:**
   - If the project requires environment variables (like API keys or database URLs), set these up as per the project's documentation.

5. **Run the Project:**
   - Follow the instructions specific to the project to start it up. This often involves a command like `npm start` for Node.js applications or a similar command specific to your tech stack.

### Testing

- To ensure everything is set up correctly, run the available test scripts. For example, in many Node.js projects, you can use:
  ```
  npm test
  ```

### Contributing

Once your setup is complete, you're ready to contribute! Make sure to adhere to the project's coding standards and guidelines when making changes or additions.

### Getting Help

If you run into any issues during setup, please refer to the project's documentation or reach out to the community through our issue tracker.

We're excited to have you onboard and look forward to your valuable contributions to the Idea Stock Exchange!
### Prerequisites

For a project like the Idea Stock Exchange, which appears to be focused on analyzing and evaluating arguments in a structured and systematic way, the initial prerequisites might include a combination of technical and conceptual elements. Here’s a list that would make sense:

### Technical Prerequisites

1. **Programming Language Proficiency:** Depending on the primary language used in the project, proficiency in languages such as Python, JavaScript, or Java could be essential.

2. **Database Knowledge:** Understanding of database management systems like MySQL, PostgreSQL, or MongoDB, especially if the project involves storing and retrieving large amounts of data.

3. **Web Development Skills:** If the project includes a web-based platform, skills in HTML, CSS, and JavaScript, along with frameworks like React or Angular, might be necessary.

4. **Version Control System:** Familiarity with Git for version control and GitHub for repository management.

5. **API Interaction:** Knowledge of RESTful APIs or GraphQL if the project involves external data sources or services.

6. **AI and Machine Learning Basics:** Understanding of AI principles, especially if the project uses machine learning for argument analysis or natural language processing.

### Conceptual Prerequisites

1. **Argumentation and Critical Thinking:** Basic understanding of argument structures, logical fallacies, and critical thinking principles.

2. **Conflict Resolution Knowledge:** Familiarity with conflict resolution strategies and cost-benefit analysis methodologies, if the project aims to resolve debates or evaluate solutions.

3. **Research Skills:** Ability to conduct thorough research and evaluate sources of information critically.

4. **Data Analysis:** Basic skills in data analysis, which could be beneficial for interpreting the results of argument evaluations.

5. **Understanding of Collective Intelligence:** Knowledge about collective intelligence principles, especially if the project aims to harness collective wisdom for decision-making.

These prerequisites ensure that contributors have the necessary technical skills to contribute effectively to the project’s development and the conceptual understanding to appreciate and work with the project’s core objectives.

### Installation

For the Idea Stock Exchange project, if it involves integrating with external APIs and uses a standard web technology stack, the installation instructions could be similar to your example, with modifications to fit the specific technologies and dependencies of your project. Here's a suggested template:

```markdown
## Installation

Follow these steps to get your development environment set up:

1. **Clone the Repository:**
   Begin by cloning the project repository to your local machine:
   ```sh
   git clone https://github.com/your_github_username/idea-stock-exchange.git
   ```

2. **Install Dependencies:**
   Navigate to the project directory and install the necessary packages:
   ```sh
   cd idea-stock-exchange
   npm install
   ```

3. **Set Up External APIs (if applicable):**
   If the project requires external APIs, obtain the necessary API keys:
   - Get a free API Key at [https://api-provider.com](https://api-provider.com)
   - Enter your API key in the configuration file:
     ```js
     // Replace 'config.js' with the actual config file name if different
     const API_KEY = 'ENTER YOUR API KEY';
     ```

4. **Database Configuration (if applicable):**
   - Set up your database and note the connection details.
   - Update the database configuration in the project settings with your credentials.

5. **Run the Application:**
   Once the setup is complete, you can start the application:
   ```sh
   npm start
   ```

6. **Access the Application:**
   Open your web browser and navigate to `http://localhost:3000` (or the port you configured) to view the application.

## Troubleshooting

If you encounter any issues during the installation, consider the following:

- Ensure that your Node.js and npm versions are up to date.
- Check if all environment variables and API keys are correctly set.
- Verify database connectivity if the application fails to connect to your database.

For further assistance, please open an issue in the GitHub issue tracker.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
```

This template provides a clear, step-by-step guide for setting up the Idea Stock Exchange project. It includes cloning the repository, installing dependencies, configuring APIs and databases, and running the application, along with troubleshooting tips. Make sure to customize the URLs, database setup details, and other specific instructions according to your project's requirements.



<!-- USAGE EXAMPLES -->
## Usage

For the Idea Stock Exchange project, usage examples should demonstrate how users can interact with the platform to engage in evidence-based debate analysis, conflict resolution, and cost-benefit analysis. Here's a template tailored for your project:

```markdown
## Usage

The Idea Stock Exchange platform is designed to facilitate structured and analytical debate on various topics. Below are some examples of how you can use the platform to enhance your understanding and participate in rational discourse.

### Engaging in Debates
1. **Select a Topic:** Choose from a range of topics on current affairs, political ideologies, or any subject of interest.
2. **View Arguments:** Examine the pro/con arguments presented for each topic.
3. **Contribute Your Perspective:** Add your own arguments or evidence, ensuring they are well-researched and relevant.

### Performing Cost-Benefit Analysis
1. **Choose a Decision:** Select a decision or policy to analyze.
2. **List Costs and Benefits:** Identify and list potential costs and benefits associated with the decision.
3. **Evaluate the Evidence:** Assess the strength of evidence supporting each cost and benefit.

### Using ReasonRank for Argument Analysis
1. **Browse Beliefs:** Explore different beliefs and their associated reasons to agree or disagree.
2. **Check ReasonRank Scores:** Understand how beliefs are scored based on the strength of their supporting and opposing arguments.
3. **Dive Deeper:** Examine the linkage and evidence scores to get a deeper understanding of each argument's validity.

### Accessing Training Modules
1. **Select a Module:** Choose from various training modules on AI policy writing, responsible AI procurement, and more.
2. **Participate in Workshops:** Engage in live workshops led by industry experts.
3. **Apply Learning:** Use these insights to inform your debate contributions or professional work.

### Collaborative Problem-Solving
1. **Identify a Problem:** Start with a specific problem or challenge.
2. **Brainstorm Solutions:** Collaborate with others to propose and refine potential solutions.
3. **Evaluate Solutions:** Use the platform's tools to analyze the feasibility and impact of each solution.

_For detailed instructions and more examples, please refer to the [Documentation](https://ideastockexchange/documentation)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>
```

This template provides users with practical ways to utilize the Idea Stock Exchange platform, from participating in debates to leveraging training modules for professional development. It's important to ensure that the links and resources mentioned are accurate and available to users for further exploration.


<!-- ROADMAP -->
## Roadmap

Certainly! For the Idea Stock Exchange project, the roadmap could outline the development and implementation of key features essential for facilitating evidence-based debate analysis, conflict resolution, and cost-benefit analysis. Here's a proposed roadmap template:

```markdown
## Roadmap

The following is a roadmap for the ongoing development and enhancement of the Idea Stock Exchange platform. This roadmap outlines key features and functionalities that we aim to implement to improve user experience and facilitate effective decision-making processes.

- [ ] **Debate and Argument Forum**
  - [ ] User-friendly interface for submitting and viewing arguments.
  - [ ] Mechanism for categorizing and tagging debates by topics.

- [ ] **Evidence-to-Conclusion Linkage Analysis**
  - [ ] Development of tools to assess the strength of evidence in supporting or opposing conclusions.
  - [ ] Integration of ReasonRank algorithm for evaluating argument validity.

- [ ] **Cost-Benefit Analysis Module**
  - [ ] Tools for users to list and evaluate potential costs and benefits of decisions.
  - [ ] Interactive platform for brainstorming and evaluating the likelihood of outcomes.

- [ ] **Training and Educational Resources**
  - [ ] Online workshops and modules on AI policy writing and responsible AI procurement.
  - [ ] Resources for public servants on AI applications in governance.

- [ ] **Collaborative Problem-Solving Tools**
  - [ ] Features for group brainstorming and collaborative solution development.
  - [ ] Implementation of voting and consensus-building mechanisms.

- [ ] **Mobile Application Development**
  - [ ] Design and release of a mobile app version for on-the-go access.
  - [ ] Integration of notifications and real-time updates.

- [ ] **Advanced Analytics and Reporting**
  - [ ] Development of analytics tools for deeper insights into debate outcomes.
  - [ ] Customizable reporting features for users to track their participation and impact.

- [ ] **User Account Management and Customization**
  - [ ] Enhanced user profile features for personalized experience.
  - [ ] Options for users to track their favorite debates and receive tailored content.

- [ ] **Platform Scalability and Performance Optimization**
  - [ ] Upgrades for handling increased user traffic and data.
  - [ ] Continuous performance enhancements for smoother user experience.

- [ ] **Community Engagement and Feedback**
  - [ ] Forums for user feedback and suggestions.
  - [ ] Regular updates based on community input and technological advancements.

For a comprehensive list of proposed features, enhancements, and known issues, please visit our [open issues](https://github.com/ideastockexchange/repo_name/issues) page.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
```

This roadmap is a guide for the future development of the Idea Stock Exchange platform. It highlights the project's commitment to evolving and adapting its features based on technological advancements and user feedback. The roadmap should be regularly updated to reflect progress and new goals.



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing to Idea Stock Exchange

The Idea Stock Exchange project thrives on community involvement, and your contributions are essential in shaping it into an effective platform for debate analysis and decision-making. Whether it's through proposing new features, enhancing existing ones, or identifying and fixing bugs, your input is invaluable.

Here's how you can contribute:

1. **Fork the Project:** Start by forking the repository. This creates your own copy of the project where you can make changes.

2. **Create your Feature Branch:** Use the command `git checkout -b feature/YourAmazingFeature` to create a branch in your repository. This is where you'll make your changes.

3. **Commit your Changes:** After making your changes, use the command `git commit -m 'Add YourAmazingFeature'` to commit those changes to your branch.

4. **Push to the Branch:** Push your changes using `git push origin feature/YourAmazingFeature`. This uploads your updates to GitHub.

5. **Open a Pull Request:** Go to the original Idea Stock Exchange repository on GitHub and open a pull request. Ensure you clearly describe the changes you've made and the value they add to the project.

### Opening Issues

If you have suggestions for improvements or have identified bugs, please open an issue with the appropriate tags such as "enhancement" or "bug". Your insights on potential improvements are crucial for the ongoing development of the platform.

### Star and Share the Project

Don't forget to give the Idea Stock Exchange project a star on GitHub! Sharing the project within your network helps grow the community and fosters a collaborative environment.

### Stay Involved

Stay engaged with the project by following updates, participating in discussions, and providing feedback on other contributors' pull requests.

Your contributions, big or small, are what make the open-source community an incredible space for innovation and growth. We look forward to seeing your ideas and efforts in making the Idea Stock Exchange an even more powerful tool for rational discourse and decision-making.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
```

This template emphasizes the value of community contributions and provides clear steps for how users can get involved with the project. It encourages not only code contributions but also participation in discussions and feedback sharing, fostering a collaborative atmosphere.



<!-- CONTACT -->
## Contact

<!-- CONTACT -->
## Contact the Idea Stock Exchange Team

For inquiries, suggestions, or to know more about the Idea Stock Exchange project, connect with us through the following channels:

- Twitter: [myclob](https://twitter.com/myclob)
- Blog: [myclob.blogspot.com](https://myclob.blogspot.com/)
- LinkedIn: [Michael Laub](https://www.linkedin.com/in/mikelaubpepmpleedbdc/)
- Future of Politics: [Project Site](https://sites.google.com/view/futureofpolitics/template)
- Wikipedia: [User:Myclob](https://en.wikipedia.org/wiki/User:Myclob)
- Kialo: [Myclob's Profile](https://www.kialo.com/userprofile/faa13dd7-d35b-4b7c-a86f-8da22c54a086?back=%2Fmy)
- Audio: [my-clob](https://audio.com/my-clob)
- Official Website: [ideastockexchange.org](https://ideastockexchange.org/)

Your contributions and insights are invaluable to our mission. Reach out to us for engaging discussions, innovative ideas, or feedback on our project.

<p align="right">(<a href="#readme-top">back to top</a>)</p>




<!-- ACKNOWLEDGMENTS Place your name here!-->
<!-- ## Acknowledgments-->
<!-- -->
<!-- * []()-->
<!-- * []()-->
<!-- * []()-->

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo_name/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo_name/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com 
