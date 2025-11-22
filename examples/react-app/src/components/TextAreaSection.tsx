import Card from './Card';
import Prompts from './Prompts';

export default function TextAreaSection() {
  return (
    <Card icon="📄" title="Text Area">
      <div className="space-y-4">
        <div>
          <label htmlFor="bio" className="label">Professional Bio</label>
          <textarea
            id="bio"
            className="input min-h-[120px] resize-y"
            placeholder="Tell us about yourself, your experience, and what you're passionate about..."
          />
        </div>

        <div>
          <label htmlFor="project-desc" className="label">Project Description</label>
          <textarea
            id="project-desc"
            className="input min-h-[120px] resize-y"
            placeholder="Describe your project in detail..."
          />
        </div>
      </div>

      <Prompts prompts={[
        'Write a bio about being a senior software engineer',
        'Fill the project description with a sample e-commerce project',
        'Clear the bio field',
        'Add a paragraph about AI and machine learning to the bio'
      ]} />
    </Card>
  );
}

