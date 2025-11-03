import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MarketingNav } from '@/components/MarketingNav';
import thoughtfulLearner from '@/assets/blog/thoughtful-learner.jpg';

export default function CriticalThinking() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      <article className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>

          <header className="mb-8 space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Cognitive Skills</span>
              <span>•</span>
              <span>January 11, 2025</span>
              <span>•</span>
              <span>9 min read</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Building Critical Thinking Skills: Moving Beyond Memorization to Deep Understanding
            </h1>
          </header>

          <img 
            src={thoughtfulLearner}
            alt="Student engaged in thoughtful contemplation while studying" 
            className="w-full h-auto rounded-lg mb-8"
          />

          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-muted-foreground mb-6">
              Critical thinking isn't a separate subject you teach on Thursdays—it's a habit of mind developed through thoughtful questions, authentic problem-solving, and space to grapple with complexity. Here's how to build genuine critical thinking capacity.
            </p>

            <h2>What Critical Thinking Actually Means</h2>
            <p>
              Critical thinking is the ability to:
            </p>
            <ul>
              <li>Analyze information from multiple perspectives</li>
              <li>Evaluate evidence quality and source credibility</li>
              <li>Identify assumptions, biases, and logical fallacies</li>
              <li>Synthesize disparate information into coherent understanding</li>
              <li>Make reasoned judgments in complex situations</li>
              <li>Articulate reasoning and defend conclusions</li>
            </ul>
            <p>
              It's not about being critical in the negative sense—it's about thinking carefully, thoroughly, and independently.
            </p>

            <h2>Why Traditional Education Undermines Critical Thinking</h2>
            <p>
              Standard classroom practices often work against critical thinking development:
            </p>
            <ul>
              <li><strong>Single-answer focus:</strong> Most questions have one "right" answer, discouraging exploration</li>
              <li><strong>Time pressure:</strong> Standardized tests reward quick recall, not deep analysis</li>
              <li><strong>Authority-based learning:</strong> "The textbook says..." discourages questioning and verification</li>
              <li><strong>Fragmented subjects:</strong> Information in isolated silos, preventing cross-domain synthesis</li>
              <li><strong>Risk-averse environment:</strong> Wrong answers penalized, so students learn to avoid intellectual risks</li>
            </ul>

            <h2>The Building Blocks of Critical Thinking</h2>

            <h3>1. Question Formation</h3>
            <p>
              Critical thinkers ask good questions. Teach your child to:
            </p>
            <ul>
              <li>Move from "What?" to "Why?" and "How do we know?"</li>
              <li>Challenge assumptions: "What if this weren't true?"</li>
              <li>Seek alternative explanations: "What else could explain this?"</li>
              <li>Probe implications: "If this is true, what follows?"</li>
            </ul>
            <p>
              Instead of always providing answers, model asking progressively better questions.
            </p>

            <h3>2. Evidence Evaluation</h3>
            <p>
              In an age of misinformation, evaluating sources is critical:
            </p>
            <ul>
              <li><strong>Source credibility:</strong> Who says this? What's their expertise? What biases might they have?</li>
              <li><strong>Evidence quality:</strong> Is this anecdote or data? Correlation or causation?</li>
              <li><strong>Logical structure:</strong> Does the argument actually support the conclusion?</li>
              <li><strong>Competing evidence:</strong> What do alternative sources say?</li>
            </ul>

            <h3>3. Perspective Taking</h3>
            <p>
              Critical thinking requires seeing beyond your own viewpoint:
            </p>
            <ul>
              <li>Steel man opposing arguments (present them at their strongest, not weakest)</li>
              <li>Identify cultural, temporal, and personal lenses affecting interpretation</li>
              <li>Consider who benefits and who's harmed by different interpretations</li>
              <li>Recognize that complex issues rarely have simple solutions</li>
            </ul>

            <h3>4. Logical Reasoning</h3>
            <p>
              Understanding how arguments work and fail:
            </p>
            <ul>
              <li>Identify logical fallacies (ad hominem, false dichotomy, slippery slope)</li>
              <li>Distinguish correlation from causation</li>
              <li>Recognize circular reasoning and question-begging</li>
              <li>Spot emotional manipulation versus logical persuasion</li>
            </ul>

            <h2>Teaching Critical Thinking Through Subjects</h2>

            <h3>History: More Than Dates and Names</h3>
            <p>
              History class should develop critical thinking:
            </p>
            <ul>
              <li>Compare primary sources with different biases</li>
              <li>Analyze historical interpretations that have changed over time</li>
              <li>Consider whose voices are missing from historical narratives</li>
              <li>Examine how current events shape historical interpretation</li>
            </ul>

            <h3>Science: Questioning and Testing</h3>
            <p>
              Science embodies critical thinking when taught well:
            </p>
            <ul>
              <li>Design experiments to test competing hypotheses</li>
              <li>Identify confounding variables and limitations</li>
              <li>Analyze why scientific consensus changes over time</li>
              <li>Distinguish correlation studies from causal research</li>
            </ul>

            <h3>Literature: Interpretation and Analysis</h3>
            <p>
              Literature develops sophisticated analytical skills:
            </p>
            <ul>
              <li>Support interpretations with textual evidence</li>
              <li>Consider author's context, biases, and assumptions</li>
              <li>Compare different critical frameworks for analysis</li>
              <li>Recognize how reader identity shapes interpretation</li>
            </ul>

            <h3>Math: Logic and Problem-Solving</h3>
            <p>
              Math teaches structured thinking:
            </p>
            <ul>
              <li>Evaluate multiple solution pathways</li>
              <li>Identify when formulas apply and when they don't</li>
              <li>Analyze real-world problems with mathematical modeling</li>
              <li>Critique statistical claims and data visualization</li>
            </ul>

            <h2>Practical Activities for Building Critical Thinking</h2>

            <h3>The Devil's Advocate Exercise</h3>
            <p>
              Choose an issue your child has an opinion on. Have them:
            </p>
            <ul>
              <li>State their position with supporting evidence</li>
              <li>Steel man the opposing view (present it at its strongest)</li>
              <li>Identify the strongest argument against their own position</li>
              <li>Revise their view based on this analysis</li>
            </ul>

            <h3>Source Comparison Project</h3>
            <p>
              Select a current event. Have your child:
            </p>
            <ul>
              <li>Read three different sources covering it (left, right, center)</li>
              <li>Identify what facts all agree on</li>
              <li>Note how framing differs even with same facts</li>
              <li>Analyze which details each source emphasizes or omits</li>
              <li>Construct their own balanced understanding</li>
            </ul>

            <h3>The "What If?" Game</h3>
            <p>
              Historical counterfactuals develop causal reasoning:
            </p>
            <ul>
              <li>"What if the South had won the Civil War?"</li>
              <li>"What if antibiotics were never discovered?"</li>
              <li>"What if social media didn't exist?"</li>
            </ul>
            <p>
              Require evidence-based speculation, not fantasy.
            </p>

            <h3>Logical Fallacy Hunt</h3>
            <p>
              Watch political debates, advertisements, or opinion pieces together:
            </p>
            <ul>
              <li>Identify fallacies used (ad hominem, straw man, appeal to emotion)</li>
              <li>Explain why the reasoning fails</li>
              <li>Reconstruct stronger versions of weak arguments</li>
            </ul>

            <h2>Creating Space for Critical Thinking</h2>
            <p>
              Critical thinking requires cognitive space:
            </p>
            <ul>
              <li><strong>Time to think:</strong> Don't fill every moment. Boredom breeds contemplation.</li>
              <li><strong>Permission to disagree:</strong> Create intellectual safety for challenging ideas</li>
              <li><strong>Tolerance for uncertainty:</strong> "I don't know yet" is often the right answer</li>
              <li><strong>Iterative thinking:</strong> Ideas develop over time; first thoughts rarely final</li>
            </ul>

            <h2>When Critical Thinking Looks Like Defiance</h2>
            <p>
              Students developing critical thinking skills may:
            </p>
            <ul>
              <li>Question your explanations or curricula choices</li>
              <li>Challenge conventional wisdom</li>
              <li>Refuse to accept "because I said so" as justification</li>
            </ul>
            <p>
              This isn't disrespect—it's exactly what we're trying to develop. The goal is thoughtful people who question authority appropriately.
            </p>

            <h2>SmartCore's Critical Thinking Integration</h2>
            <p>
              Our platform develops critical thinking systematically:
            </p>
            <ul>
              <li><strong>Open-ended questions:</strong> Not all assessments have single answers</li>
              <li><strong>Multiple perspectives:</strong> Content presents diverse viewpoints on complex topics</li>
              <li><strong>Evidence-based reasoning:</strong> Students must support conclusions with source material</li>
              <li><strong>Cross-subject synthesis:</strong> Projects integrate multiple domains, preventing silo thinking</li>
              <li><strong>Metacognitive reflection:</strong> Students analyze their own thinking processes</li>
            </ul>

            <h2>The Long-Term Payoff</h2>
            <p>
              Critical thinking capacity is the ultimate transferable skill. It enables:
            </p>
            <ul>
              <li>Adapting to career changes in evolving job markets</li>
              <li>Making informed civic and personal decisions</li>
              <li>Resisting manipulation and misinformation</li>
              <li>Continuous learning and intellectual growth</li>
              <li>Contributing meaningfully to complex societal challenges</li>
            </ul>
            <p>
              Memorized facts have a short shelf life. Critical thinking lasts forever.
            </p>

            <div className="mt-12 p-6 bg-muted rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Develop Real Critical Thinking Skills</h3>
              <p className="mb-4">
                SmartCore's curriculum emphasizes deep analysis, evidence evaluation, and independent reasoning.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}