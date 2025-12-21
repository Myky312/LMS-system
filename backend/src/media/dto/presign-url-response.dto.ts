import { ApiProperty } from '@nestjs/swagger';

export class PresignUrlResponseDto {
  @ApiProperty({
    example: 'https://s3.amazonaws.com/bucket/file.mp3?signature=...',
  })
  uploadUrl!: string;

  @ApiProperty({ example: 's3://bucket/file.mp3' })
  fileUrl!: string;
}
