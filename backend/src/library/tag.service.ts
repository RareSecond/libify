import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { DatabaseService } from '../database/database.service';
import { CreateTagDto, TagResponseDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  constructor(private databaseService: DatabaseService) {}

  async addTagToTrack(userId: string, trackId: string, tagId: string): Promise<void> {
    // Verify the track belongs to the user
    const track = await this.databaseService.userTrack.findFirst({
      where: { id: trackId, userId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // Verify the tag belongs to the user
    const tag = await this.databaseService.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Check if the association already exists
    const existing = await this.databaseService.trackTag.findUnique({
      where: {
        userTrackId_tagId: {
          tagId,
          userTrackId: trackId,
        },
      },
    });

    if (!existing) {
      await this.databaseService.trackTag.create({
        data: {
          tagId,
          userTrackId: trackId,
        },
      });
    }
  }

  async createTag(userId: string, createTagDto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.databaseService.tag.create({
      data: {
        ...createTagDto,
        userId,
      },
    });

    return plainToInstance(TagResponseDto, tag, { excludeExtraneousValues: true });
  }

  async deleteTag(userId: string, tagId: string): Promise<void> {
    const tag = await this.databaseService.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Delete all track associations first
    await this.databaseService.trackTag.deleteMany({
      where: { tagId },
    });

    // Then delete the tag
    await this.databaseService.tag.delete({
      where: { id: tagId },
    });
  }

  async getUserTags(userId: string): Promise<TagResponseDto[]> {
    const tags = await this.databaseService.tag.findMany({
      orderBy: { name: 'asc' },
      where: { userId },
    });

    return tags.map(tag => 
      plainToInstance(TagResponseDto, tag, { excludeExtraneousValues: true })
    );
  }

  async removeTagFromTrack(userId: string, trackId: string, tagId: string): Promise<void> {
    // Verify the track belongs to the user
    const track = await this.databaseService.userTrack.findFirst({
      where: { id: trackId, userId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    await this.databaseService.trackTag.deleteMany({
      where: {
        tagId,
        userTrackId: trackId,
      },
    });
  }

  async updateTag(userId: string, tagId: string, updateTagDto: UpdateTagDto): Promise<TagResponseDto> {
    const tag = await this.databaseService.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const updatedTag = await this.databaseService.tag.update({
      data: updateTagDto,
      where: { id: tagId },
    });

    return plainToInstance(TagResponseDto, updatedTag, { excludeExtraneousValues: true });
  }
}