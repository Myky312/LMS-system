import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '../../common/enums';

export const reviewSubmissionSchema = z.object({
  status: z.enum([SubmissionStatus.APPROVED, SubmissionStatus.REJECTED]),
  feedback: z.string().optional(),
});

export class ReviewSubmissionDto {
  @ApiProperty({ enum: SubmissionStatus, example: SubmissionStatus.APPROVED })
  status!: SubmissionStatus;

  @ApiProperty({ example: 'Good pronunciation!', required: false })
  feedback?: string;
}
