/**
 * Custom hooks for fetching and managing projects
 */

import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { OBJECT_TYPES } from '../config/constants';
import type { Project } from '../types/contract';
import type { ProjectMetadata } from '../types/walrus';
import { fetchJson } from '../utils/walrusClient';
import { parseProjectMetadata } from '../utils/walrusSchemas';

/**
 * Fetch all projects from the Sui blockchain
 */
export const useAllProjects = () => {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['projects', 'all'],
    queryFn: async () => {
      try {
        // Query all objects of Project type using queryEvents
        // This works by listening to ProjectCreated events
        // Alternative: For a full implementation, you would:
        // 1. Index ProjectCreated events to get all project IDs
        // 2. Or make Project objects shared and query them
        // 3. Or use Sui indexer API
        
        // For now, we'll use queryEvents to get ProjectCreated events
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${OBJECT_TYPES.PROJECT.split('::').slice(0, 2).join('::')}::foundry::ProjectCreated`,
          },
          limit: 50, // Adjust as needed
        });

        // Extract project IDs from events
        const projectIds: string[] = [];
        for (const event of events.data) {
          if (event.parsedJson && typeof event.parsedJson === 'object' && 'project_id' in event.parsedJson) {
            projectIds.push((event.parsedJson as { project_id: string }).project_id);
          }
        }

        console.log(`Found ${projectIds.length} project IDs from events`);

        // Fetch project objects using multiGetObjects
        if (projectIds.length === 0) {
          console.log('No projects found');
          return [];
        }

        const projectsResponse = await client.multiGetObjects({
          ids: projectIds,
          options: {
            showContent: true,
            showType: true,
            showOwner: true,
          },
        });

        // Extract and parse project data
        const projects: Project[] = [];
        
        for (const item of projectsResponse) {
          if (item.data?.content && 'fields' in item.data.content) {
            const fields = item.data.content.fields as Record<string, unknown>;
            
            // Map the on-chain data to our Project interface
            const project: Project = {
              id: fields.id as { id: string },
              owner: fields.owner as string,
              funding_goal: fields.funding_goal as string,
              current_funding: fields.current_funding as string,
              deadline: fields.deadline as string,
              metadata_cid: fields.metadata_cid as string,
              balance: fields.balance as string,
              job_counter: fields.job_counter as string,
              poll_counter: fields.poll_counter as string,
              is_withdrawn: fields.is_withdrawn as boolean,
            };
            
            projects.push(project);
          }
        }

        console.log(`✅ Fetched ${projects.length} projects from Sui`);
        return projects;
      } catch (error) {
        console.error('❌ Error fetching projects:', error);
        // Return empty array instead of throwing to prevent app crash when no projects exist
        return [];
      }
    },
    staleTime: 30_000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
};

/**
 * Fetch a single project by ID
 */
export const useProject = (projectId: string | undefined) => {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      try {
        const response = await client.getObject({
          id: projectId,
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (!response.data?.content || !('fields' in response.data.content)) {
          throw new Error('Project not found');
        }

        const fields = response.data.content.fields as Record<string, unknown>;

        const project: Project = {
          id: fields.id as { id: string },
          owner: fields.owner as string,
          funding_goal: fields.funding_goal as string,
          current_funding: fields.current_funding as string,
          deadline: fields.deadline as string,
          metadata_cid: fields.metadata_cid as string,
          balance: fields.balance as string,
          job_counter: fields.job_counter as string,
          poll_counter: fields.poll_counter as string,
          is_withdrawn: fields.is_withdrawn as boolean,
        };

        return project;
      } catch (error) {
        console.error(`❌ Error fetching project ${projectId}:`, error);
        throw error;
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
};

/**
 * Fetch project metadata from Walrus
 */
export const useProjectMetadata = (metadataCid: string | undefined) => {
  return useQuery({
    queryKey: ['projectMetadata', metadataCid],
    queryFn: async () => {
      if (!metadataCid) throw new Error('Metadata CID is required');

      try {
        // Fetch from Walrus
        const data = await fetchJson<ProjectMetadata>(metadataCid);
        
        // Validate and parse
        const metadata = parseProjectMetadata(data);
        
        console.log(`✅ Fetched metadata for CID: ${metadataCid}`);
        return metadata;
      } catch (error) {
        console.error(`❌ Error fetching metadata ${metadataCid}:`, error);
        throw error;
      }
    },
    enabled: !!metadataCid,
    staleTime: 60_000, // Cache metadata for 1 minute (it changes less frequently)
    retry: 2, // Retry failed requests
  });
};

/**
 * Combined hook to fetch both project and its metadata
 */
export const useProjectWithMetadata = (projectId: string | undefined) => {
  const projectQuery = useProject(projectId);
  const metadataQuery = useProjectMetadata(projectQuery.data?.metadata_cid);

  return {
    project: projectQuery.data,
    metadata: metadataQuery.data,
    isLoading: projectQuery.isLoading || metadataQuery.isLoading,
    isError: projectQuery.isError || metadataQuery.isError,
    error: projectQuery.error || metadataQuery.error,
    refetch: () => {
      projectQuery.refetch();
      metadataQuery.refetch();
    },
  };
};

/**
 * Hook to calculate funding progress percentage
 */
export const useFundingProgress = (project: Project | undefined): number => {
  if (!project) return 0;

  const current = parseInt(project.current_funding);
  const goal = parseInt(project.funding_goal);

  if (goal === 0) return 0;

  const percentage = (current / goal) * 100;
  return Math.min(percentage, 100); // Cap at 100%
};

/**
 * Hook to check if project deadline has passed
 */
export const useIsProjectExpired = (project: Project | undefined): boolean => {
  if (!project) return false;

  const deadline = parseInt(project.deadline);
  const now = Date.now();

  return now > deadline;
};

/**
 * Hook to get time remaining until deadline
 */
export const useTimeRemaining = (project: Project | undefined) => {
  if (!project) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const deadline = parseInt(project.deadline);
  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, expired: false };
};

