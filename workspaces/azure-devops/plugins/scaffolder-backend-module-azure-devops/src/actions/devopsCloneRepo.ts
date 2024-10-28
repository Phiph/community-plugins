/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  cloneRepo,
  createTemplateAction,
} from '@backstage/plugin-scaffolder-node';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { examples } from './devopsCloneRepo.examples';

import { InputError } from '@backstage/errors';
import {
  getBearerHandler,
  getPersonalAccessTokenHandler,
  WebApi,
} from 'azure-devops-node-api';
import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
/**
 * Creates an `acme:example` Scaffolder action.
 *
 * @remarks
 *
 * See {@link https://example.com} for more information.
 *
 * @public
 */
export function createAzureDevopsCloneRepoAction(options: {
  integrations: ScmIntegrationRegistry;
}) {
  const { integrations } = options;

  return createTemplateAction<{
    remoteUrl: string;
    branch?: string;
    targetPath?: string;
    host: string;
    token?: string;
  }>({
    id: 'azure:repo:clone',
    description: 'Clone an Azure repository into the workspace directory.',
    schema: {
      input: {
        required: ['remoteUrl'],
        type: 'object',
        properties: {
          remoteUrl: {
            title: 'Remote URL',
            type: 'string',
            description: 'The Git URL to the repository.',
          },
          branch: {
            title: 'Repository Branch',
            type: 'string',
            description: 'The branch to checkout to.',
          },
          targetPath: {
            title: 'Working Subdirectory',
            type: 'string',
            description:
              'The subdirectory of the working directory to clone the repository into.',
          },
          host: {
            type: 'string',
            title: 'Server hostname',
            description:
              'The hostname of the Azure DevOps service. Defaults to dev.azure.com',
          },
          token: {
            title: 'Authentication Token',
            type: 'string',
            description: 'The token to use for authorization.',
          },
        },
      },
    },
    async handler(ctx) {
      const { remoteUrl, branch, host = 'dev.azure.com' } = ctx.input;

      const credentialProvider =
        DefaultAzureDevOpsCredentialsProvider.fromIntegrations(integrations);
      const credentials = await credentialProvider.getCredentials({
        url: host,
      });

      if (credentials === undefined && ctx.input.token === undefined) {
        throw new InputError(
          `No credentials provided ${host}, please check your integrations config`,
        );
      }

      const targetPath = ctx.input.targetPath ?? './';
      const outputDir = resolveSafeChildPath(ctx.workspacePath, targetPath);

      // Log the createOptions object in a readable format
      ctx.logger.debug(
        'Create options for running the pipeline:',
        JSON.stringify(createOptions, null, 2),
      );

      await cloneRepo({
        url: remoteUrl,
        dir: outputDir,
        auth: { token: ctx.input.token ?? credentials!.token },
        logger: ctx.logger,
        ref: branch,
      });

      // Log the pipeline run URL
      ctx.logger.info(`Repo cloned to workspace`);
    },
  });
}
