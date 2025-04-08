import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export default function ProjectSummary({ data }) {
  if (!data) {
    return <p className="text-center text-red-500">No summary data available.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">{data.repoName || 'Project Summary'}</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.summary && <p>{data.summary}</p>}
          {data.architecture && <p><strong>Architecture:</strong> {data.architecture}</p>}
        </CardContent>
      </Card>

      <Accordion type="multiple" className="space-y-2">
        {data.authentication?.length > 0 && (
          <AccordionItem value="auth">
            <AccordionTrigger>🔐 Authentication Methods</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5">
                {data.authentication.map((auth, idx) => (
                  <li key={idx}>{auth}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {data.apiEndpoints?.length > 0 && (
          <AccordionItem value="api">
            <AccordionTrigger>📡 API Endpoints</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {data.apiEndpoints.map((ep, idx) => (
                  <li key={idx}>
                    <code className="bg-muted px-2 py-1 rounded">
                      {ep.method.toUpperCase()} {ep.path}
                    </code>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {data.dependencies?.length > 0 && (
          <AccordionItem value="dependencies">
            <AccordionTrigger>📦 Dependencies</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {data.dependencies.map((dep, idx) => (
                  <Badge key={idx} variant="outline">{dep}</Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {data.frameworks?.length > 0 && (
          <AccordionItem value="frameworks">
            <AccordionTrigger>🧰 Frameworks / Tools</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {data.frameworks.map((fw, idx) => (
                  <Badge key={idx}>{fw}</Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {data.environmentVariables?.length > 0 && (
          <AccordionItem value="env">
            <AccordionTrigger>🔧 Environment Variables</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5">
                {data.environmentVariables.map((env, idx) => (
                  <li key={idx}>{env}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {data.languages?.length > 0 && (
          <AccordionItem value="languages">
            <AccordionTrigger>🌐 Languages</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {data.languages.map((lang, idx) => (
                  <Badge key={idx} variant="secondary">{lang}</Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {data.database && (
          <AccordionItem value="database">
            <AccordionTrigger>🗄️ Database</AccordionTrigger>
            <AccordionContent>{data.database}</AccordionContent>
          </AccordionItem>
        )}

        {data.folderRoles?.length > 0 && (
          <AccordionItem value="folders">
            <AccordionTrigger>📂 Folder Roles</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {data.folderRoles.map((folder, idx) => (
                  <li key={idx}>
                    <code className="font-mono text-sm">{folder.path}</code>: {folder.role}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
