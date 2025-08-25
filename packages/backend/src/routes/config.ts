import { FastifyInstance } from 'fastify';
import { WeightedMemoryFusion } from '@rpg/types';

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  
  // Get current MCA configuration
  fastify.get('/', async () => {
    return fastify.mca.config;
  });

  // Update fusion weights
  fastify.post<{ Body: { fusion_weights: WeightedMemoryFusion } }>('/fusion-weights', async (request, reply) => {
    try {
      const { fusion_weights } = request.body;
      
      // Validate weights sum to 1.0 (approximately)
      const total = fusion_weights.w_L1 + fusion_weights.w_L2 + fusion_weights.w_L3;
      if (Math.abs(total - 1.0) > 0.01) {
        return reply.status(400).send({
          error: 'Invalid fusion weights',
          message: 'Weights must sum to approximately 1.0'
        });
      }
      
      // Update the MCA configuration
      fastify.mca.updateFusionWeights(fusion_weights);
      
      return { 
        message: 'Fusion weights updated successfully',
        new_weights: fusion_weights
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to update fusion weights',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get current token cost estimation for given weights
  fastify.post<{ 
    Body: { 
      fusion_weights: WeightedMemoryFusion;
      query?: string;
      session_id?: string;
    } 
  }>('/estimate-tokens', async (request, reply) => {
    try {
      const { fusion_weights, query = 'test query', session_id = 'test' } = request.body;
      
      const estimation = await fastify.mca.estimateTokenCost({
        query_text: query,
        session_id,
        fusion_weights
      });
      
      return estimation;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to estimate token cost',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update significance threshold
  fastify.post<{ Body: { threshold: number } }>('/significance-threshold', async (request, reply) => {
    try {
      const { threshold } = request.body;
      
      if (threshold < 0 || threshold > 10) {
        return reply.status(400).send({
          error: 'Invalid threshold',
          message: 'Threshold must be between 0 and 10'
        });
      }
      
      fastify.mca.updateSignificanceThreshold(threshold);
      
      return { 
        message: 'Significance threshold updated successfully',
        new_threshold: threshold
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to update significance threshold',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}