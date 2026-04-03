import { useEffect, useState, useCallback } from 'react';
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { coursesApi, Course } from '../../api/courses';
import { Loading, Empty, CourseCard } from '../../components';
import { CourseTypes, CourseLevels } from '../../constants/enums';
import './index.scss';

const TYPE_ALL = 'ALL';
const LEVEL_ALL = 'ALL';

export default function Courses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeType, setActiveType] = useState(TYPE_ALL);
  const [activeLevel, setActiveLevel] = useState(LEVEL_ALL);

  const fetchCourses = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (currentPage === 1) setLoading(true);

      const params: any = {
        page: currentPage,
        limit: 10,
        isActive: true,
      };
      if (activeType !== TYPE_ALL) params.type = activeType;
      if (activeLevel !== LEVEL_ALL) params.level = activeLevel;

      const res = await coursesApi.getAll(params);
      const newCourses = res.data.courses || [];
      const meta = res.data.meta;

      if (append) {
        setCourses((prev) => [...prev, ...newCourses]);
      } else {
        setCourses(newCourses);
      }

      setHasMore(meta ? meta.page < meta.totalPages : newCourses.length === 10);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  }, [activeType, activeLevel]);

  useEffect(() => {
    fetchCourses(1, false);
  }, [fetchCourses]);

  usePullDownRefresh(() => {
    fetchCourses(1, false);
  });

  useReachBottom(() => {
    if (hasMore && !loading) {
      fetchCourses(page + 1, true);
    }
  });

  const handleCourseClick = (course: Course) => {
    Taro.navigateTo({ url: `/pages/course-detail/index?id=${course.id}` });
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setPage(1);
  };

  const handleLevelChange = (level: string) => {
    setActiveLevel(level);
    setPage(1);
  };

  return (
    <View className='courses'>
      {/* Filter Bar */}
      <View className='courses__filters'>
        <ScrollView className='courses__filter-scroll' scrollX enhanced showScrollbar={false}>
          <View className='courses__filter-group'>
            <View
              className={`courses__filter-item ${activeType === TYPE_ALL ? 'courses__filter-item--active' : ''}`}
              onClick={() => handleTypeChange(TYPE_ALL)}
            >
              <Text>全部类型</Text>
            </View>
            {CourseTypes.map((t) => (
              <View
                key={t.value}
                className={`courses__filter-item ${activeType === t.value ? 'courses__filter-item--active' : ''}`}
                onClick={() => handleTypeChange(t.value)}
              >
                <Text>{t.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <ScrollView className='courses__filter-scroll' scrollX enhanced showScrollbar={false}>
          <View className='courses__filter-group'>
            <View
              className={`courses__filter-item ${activeLevel === LEVEL_ALL ? 'courses__filter-item--active' : ''}`}
              onClick={() => handleLevelChange(LEVEL_ALL)}
            >
              <Text>全部难度</Text>
            </View>
            {CourseLevels.map((l) => (
              <View
                key={l.value}
                className={`courses__filter-item ${activeLevel === l.value ? 'courses__filter-item--active' : ''}`}
                onClick={() => handleLevelChange(l.value)}
              >
                <Text>{l.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Course List */}
      <ScrollView className='courses__list' scrollY enhanced showScrollbar={false}>
        {loading && page === 1 ? (
          <Loading />
        ) : courses.length > 0 ? (
          <View className='courses__grid'>
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} onClick={() => handleCourseClick(course)} />
            ))}
          </View>
        ) : (
          <Empty title='暂无课程' description='试试其他筛选条件' />
        )}
        {hasMore && !loading && courses.length > 0 && (
          <View className='courses__loading-more'>
            <Text className='courses__loading-more-text'>加载中...</Text>
          </View>
        )}
        {!hasMore && courses.length > 0 && (
          <View className='courses__no-more'>
            <Text className='courses__no-more-text'>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
