import Card from './Card';
import Prompts from './Prompts';

export default function SelectionControls() {
  return (
    <Card icon="🎯" title="Selection Controls">
      <div className="space-y-4">
        <div>
          <label htmlFor="country" className="label">Country</label>
          <select id="country" className="input">
            <option value="">Select country...</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
            <option value="au">Australia</option>
            <option value="de">Germany</option>
            <option value="fr">France</option>
            <option value="jp">Japan</option>
          </select>
        </div>

        <div>
          <label htmlFor="role" className="label">Role</label>
          <select id="role" className="input">
            <option value="">Select role...</option>
            <option value="developer">Software Developer</option>
            <option value="designer">UI/UX Designer</option>
            <option value="manager">Project Manager</option>
            <option value="analyst">Data Analyst</option>
          </select>
        </div>

        <div>
          <label htmlFor="skills" className="label">Skills (Multi-Select)</label>
          <select id="skills" multiple className="input min-h-[120px]">
            <option value="js">JavaScript</option>
            <option value="ts">TypeScript</option>
            <option value="py">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </select>
        </div>
      </div>

      <Prompts prompts={[
        'Select Canada as the country',
        'Choose Software Developer as the role',
        'Select JavaScript, TypeScript, and Python from skills',
        'What countries are available?',
        'List all the skills options',
        'Clear the country selection'
      ]} />
    </Card>
  );
}

